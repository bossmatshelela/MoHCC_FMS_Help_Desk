import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Middleware for parsing JSON with ample headroom for base64 optical scans
app.use(express.json({ limit: '30mb' }));

// Shared server-side Gemini client
const getAiClient = (): GoogleGenAI | null => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

const OFFICIAL_DEPARTMENTS = [
  'Reproductive, Maternal & Child Health',
  'IT Help Desk & Infrastructure',
  'Epidemiology & Disease Control',
  'Pharmacy & Logistics (NatPharm)',
  'Clinical Guidelines & Standards',
  'Finance & Health Procurement',
  'Personnel & Administration',
];

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'MoHCC IT Help Desk & Document Management Server',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
  });
});

/**
 * Server-Side Document Category Classification
 * Uses Gemini 3.8 Flash to evaluate document titles and content text
 */
app.post('/api/gemini/classify-category', async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title && !content) {
      return res.status(400).json({ error: 'Title or content required for classification.' });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on server.',
        fallbackRequired: true,
      });
    }

    const textToAnalyze = `${title || 'Untitled Document'}\n\n${(content || '').slice(0, 3000)}`;

    const prompt = `You are the Ministry of Health and Child Care (MoHCC) health informatics document classification AI.
Analyze the following document title and scanned content:
"""
${textToAnalyze}
"""

Classify this document into EXACTLY ONE of the following 7 official MoHCC departments:
1. Reproductive, Maternal & Child Health
2. IT Help Desk & Infrastructure
3. Epidemiology & Disease Control
4. Pharmacy & Logistics (NatPharm)
5. Clinical Guidelines & Standards
6. Finance & Health Procurement
7. Personnel & Administration

Return a strict JSON object with NO markdown or code fences:
{
  "suggestedCategory": "One of the 7 exact departments above",
  "confidenceScore": integer between 75 and 99,
  "rationale": "One clear sentence explaining the specific clinical, technical, or administrative terms that justify this recommendation",
  "keywordsDetected": ["3-5 prominent keywords found in the text"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const responseText = response.text || '';
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    if (OFFICIAL_DEPARTMENTS.includes(parsed.suggestedCategory)) {
      return res.json({
        suggestedCategory: parsed.suggestedCategory,
        confidenceScore: Number(parsed.confidenceScore) || 95,
        rationale: parsed.rationale || 'Matched clinical terminology and MoHCC document structure.',
        keywordsDetected: Array.isArray(parsed.keywordsDetected) ? parsed.keywordsDetected : [],
      });
    }

    return res.status(422).json({ error: 'Model returned unverified category.', raw: responseText });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error in /api/gemini/classify-category:', errorMsg);
    return res.status(500).json({ error: errorMsg, fallbackRequired: true });
  }
});

/**
 * Server-Side Scanned Document Optical Analysis
 * Performs OCR and extraction on uploaded images or PDFs using Gemini 3.8 Flash
 */
app.post('/api/gemini/analyze-document', async (req, res) => {
  try {
    const { fileName, base64Data, presetType } = req.body;

    const ai = getAiClient();
    if (!ai || !base64Data) {
      return res.status(503).json({
        error: 'Gemini API key is not configured or no image payload provided.',
        fallbackRequired: true,
      });
    }

    const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const mimeMatch = base64Data.match(/^data:([a-zA-Z0-9/+-]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const prompt = `You are the optical document recognition and classification intelligence for the Ministry of Health and Child Care (MoHCC) Help Desk and IT Department.
Analyze this scanned official health/IT document image or text filename "${fileName || 'Scanned_Record'}".
Provide a strict JSON response with no markdown formatting:
{
  "title": "Clear concise official document title",
  "category": "One of: Reproductive, Maternal & Child Health | IT Help Desk & Infrastructure | Epidemiology & Disease Control | Pharmacy & Logistics (NatPharm) | Clinical Guidelines & Standards | Finance & Health Procurement | Personnel & Administration",
  "confidentiality": "One of: PUBLIC | INTERNAL | CONFIDENTIAL | RESTRICTED_MEDICAL",
  "summary": "1-2 sentence executive summary of the document",
  "ocrText": "Verbatim transcript of visible text in the document",
  "extractedEntities": [
    { "label": "e.g. Facility / Patient ID / Batch / Lot / Officer", "value": "extracted value" }
  ],
  "tags": ["3 to 5 relevant health/IT tags"],
  "scanQuality": 98,
  "confidenceScore": 96,
  "rationale": "Clinical or administrative justification for this classification",
  "keywordsDetected": ["3-5 prominent keywords"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            { text: prompt },
          ],
        },
      ],
    });

    const responseText = response.text || '';
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    const category = OFFICIAL_DEPARTMENTS.includes(parsed.category)
      ? parsed.category
      : 'IT Help Desk & Infrastructure';

    const aiCategorySuggestion = {
      suggestedCategory: category,
      confidenceScore: Number(parsed.confidenceScore) || 95,
      rationale: parsed.rationale || 'Matched clinical terminology and MoHCC document structure.',
      keywordsDetected: Array.isArray(parsed.keywordsDetected) ? parsed.keywordsDetected : [],
    };

    return res.json({
      title: parsed.title || `MoHCC Scanned Record - ${fileName}`,
      category,
      confidentiality: parsed.confidentiality || 'CONFIDENTIAL',
      summary: parsed.summary || 'Digitized and indexed by MoHCC IT Help Desk scanner.',
      ocrText: parsed.ocrText || 'Transcribed official Ministry record.',
      extractedEntities: Array.isArray(parsed.extractedEntities) ? parsed.extractedEntities : [],
      tags: Array.isArray(parsed.tags) ? parsed.tags : ['MoHCC', 'Digitized'],
      scanQuality: typeof parsed.scanQuality === 'number' ? parsed.scanQuality : 98,
      aiCategorySuggestion,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error in /api/gemini/analyze-document:', errorMsg);
    return res.status(500).json({ error: errorMsg, fallbackRequired: true });
  }
});

/**
 * Server-Side Generic Content Generation
 */
app.post('/api/gemini/generate', async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({ error: 'Gemini API key is not configured on server.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined,
    });

    return res.json({ text: response.text });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error in /api/gemini/generate:', errorMsg);
    return res.status(500).json({ error: errorMsg });
  }
});

/**
 * Server-Side Streaming Text Generation (SSE)
 */
app.post('/api/gemini/stream', async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({ error: 'Gemini API key is not configured on server.' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const streamResponse = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined,
    });

    for await (const chunk of streamResponse) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error in /api/gemini/stream:', errorMsg);
    if (!res.headersSent) {
      return res.status(500).json({ error: errorMsg });
    }
    res.end();
  }
});

// Create shared HTTP server
const httpServer = http.createServer(app);

// Server-side WebSocket server for Gemini Live API real-time bridging
const wss = new WebSocketServer({ server: httpServer, path: '/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[Live API WS] Client connected to /live');
  const ai = getAiClient();
  if (!ai) {
    clientWs.send(JSON.stringify({ error: 'Gemini API key not configured on server.' }));
    clientWs.close();
    return;
  }

  try {
    const session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: 'You are the Ministry of Health and Child Care Help Desk AI assistant.',
      },
      callbacks: {
        onmessage: (message) => {
          for (const part of message.serverContent?.modelTurn?.parts ?? []) {
            if (part.inlineData?.data) {
              clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
            }
          }
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
        },
      },
    });

    clientWs.on('message', (data: Buffer | string) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.audio) {
          session.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        }
      } catch (e) {
        console.error('[Live API WS] Error parsing client message:', e);
      }
    });

    clientWs.on('close', () => {
      console.log('[Live API WS] Client disconnected');
      session.close();
    });
  } catch (err) {
    console.error('[Live API WS] Error establishing Live session:', err);
    clientWs.send(JSON.stringify({ error: 'Failed to initiate Gemini Live API session.' }));
    clientWs.close();
  }
});

// Mount Vite middleware in development, or serve built bundle in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: {
      middlewareMode: true,
      hmr: false,
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`MoHCC Document Vault server listening at http://0.0.0.0:${port}`);
});
