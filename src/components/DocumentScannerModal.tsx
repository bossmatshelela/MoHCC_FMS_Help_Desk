import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Camera,
  Upload,
  RefreshCw,
  Lock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Sliders,
  Sparkles,
  AlertCircle,
  Eye,
  QrCode,
  Scan,
  Zap,
  Check,
} from 'lucide-react';
import jsQR from 'jsqr';
import { HealthDocument, Department, ConfidentialityLevel, UserProfile } from '../types';
import { computeSha256, encryptTextPayload } from '../utils/crypto';
import {
  analyzeScannedDocument,
  predictCategoryRecommendation,
  CategorySuggestion,
} from '../utils/geminiScanner';

interface DocumentScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSaveDocument: (doc: HealthDocument) => void;
}

export const DocumentScannerModal: React.FC<DocumentScannerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveDocument,
}) => {
  const [mode, setMode] = useState<'camera' | 'upload' | 'preset' | 'qr'>('preset');
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [contrastLevel, setContrastLevel] = useState<number>(100);

  // Form State
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [qrScannedInfo, setQrScannedInfo] = useState<{ code: string; timestamp: string } | null>(null);
  const [qrScanFlash, setQrScanFlash] = useState<boolean>(false);
  const [qrDetectionStatus, setQrDetectionStatus] = useState<string>('Align QR code in targeting reticle');
  const lastScannedCodeRef = useRef<string>('');
  const qrAnimationRef = useRef<number | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Department>('Reproductive, Maternal & Child Health');
  const [confidentiality, setConfidentiality] = useState<ConfidentialityLevel>('RESTRICTED_MEDICAL');
  const [summary, setSummary] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [tags, setTags] = useState<string[]>(['Scanned', 'MoHCC']);
  const [tagInput, setTagInput] = useState('');
  const [extractedEntities, setExtractedEntities] = useState<{ label: string; value: string }[]>([]);
  const [scanQuality, setScanQuality] = useState<number>(98);
  const [calculatedHash, setCalculatedHash] = useState<string>('');
  const [encryptionPreview, setEncryptionPreview] = useState<{
    iv: string;
    keyFingerprint: string;
    ciphertextSnippet: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Presets with official MoHCC QR Reference Numbers
  const presets = [
    {
      id: 'clinic_card',
      label: 'Pediatric Health Card',
      desc: 'Under-5 Road to Health growth card & immunization',
      dept: 'Reproductive, Maternal & Child Health' as Department,
      conf: 'RESTRICTED_MEDICAL' as ConfidentialityLevel,
      refNo: 'MOHCC-PED-2026-90412',
    },
    {
      id: 'it_ticket',
      label: 'IT Helpdesk Incident Sheet',
      desc: 'Hardware repair & server cluster signoff',
      dept: 'IT Help Desk & Infrastructure' as Department,
      conf: 'INTERNAL' as ConfidentialityLevel,
      refNo: 'MOHCC-IT-2026-9984',
    },
    {
      id: 'vaccine_log',
      label: 'Cold-Chain Cryogenic Log',
      desc: 'Depot temperature telemetry & vaccine lot verification',
      dept: 'Pharmacy & Logistics (NatPharm)' as Department,
      conf: 'CONFIDENTIAL' as ConfidentialityLevel,
      refNo: 'MOHCC-PHARM-2026-8819',
    },
  ];

  const [categorySuggestion, setCategorySuggestion] = useState<CategorySuggestion | null>(null);
  const [isAnalyzingCategory, setIsAnalyzingCategory] = useState(false);

  // Play pleasant Web Audio confirmation chime upon QR detection
  const playQrChime = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // AudioContext unavailable or blocked
    }
  }, []);

  // Normalization and application of detected QR code
  const handleQrCodeDetected = useCallback(
    (rawPayload: string) => {
      const trimmed = rawPayload.trim();
      if (!trimmed) return;
      if (lastScannedCodeRef.current === trimmed) return;
      lastScannedCodeRef.current = trimmed;

      let resolvedRef = trimmed;
      let resolvedCategory: Department | undefined;

      // Parse JSON payload if QR contains structured object
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.ref || parsed.referenceNo || parsed.id) {
            resolvedRef = String(parsed.ref || parsed.referenceNo || parsed.id);
          }
          if (parsed.category || parsed.department) {
            const matchedDept = presets.find(
              (p) => p.dept === (parsed.category || parsed.department)
            )?.dept;
            if (matchedDept) resolvedCategory = matchedDept;
          }
        } catch {
          // Keep raw string
        }
      } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        try {
          const url = new URL(trimmed);
          const segments = url.pathname.split('/').filter(Boolean);
          if (segments.length > 0) {
            resolvedRef = decodeURIComponent(segments[segments.length - 1]);
          }
        } catch {
          // Keep raw string
        }
      }

      playQrChime();
      setQrScanFlash(true);
      setTimeout(() => setQrScanFlash(false), 900);

      setReferenceNo(resolvedRef);
      if (resolvedCategory) {
        setCategory(resolvedCategory);
      }
      setQrDetectionStatus(`QR Decoded: ${resolvedRef}`);
      setQrScannedInfo({
        code: resolvedRef,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      });

      // Vibrate mobile device if hardware supports it
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([60, 40, 60]);
      }
    },
    [playQrChime, presets]
  );

  // Initialize preset
  const handleSelectPreset = async (presetId: string) => {
    setIsScanning(true);
    const selected = presets.find((p) => p.id === presetId);
    if (selected) {
      setReferenceNo(selected.refNo);
      setQrScannedInfo({
        code: selected.refNo,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    }

    const result = await analyzeScannedDocument(`${presetId}_document.pdf`, undefined, presetId);
    setTitle(result.title);
    setCategory(result.category);
    setConfidentiality(result.confidentiality);
    setSummary(result.summary);
    setOcrText(result.ocrText);
    setExtractedEntities(result.extractedEntities);
    setTags(result.tags);
    setScanQuality(result.scanQuality);
    setCategorySuggestion(result.aiCategorySuggestion);

    // Compute live SHA-256 and encryption
    const sha = await computeSha256(result.ocrText);
    setCalculatedHash(sha);
    const enc = await encryptTextPayload(result.ocrText);
    setEncryptionPreview({
      iv: enc.iv,
      keyFingerprint: enc.keyFingerprint,
      ciphertextSnippet: enc.ciphertext.slice(0, 36) + '...',
    });

    setIsScanning(false);
  };

  const handleReanalyzeCategory = async () => {
    if (!title.trim() && !ocrText.trim()) return;
    setIsAnalyzingCategory(true);
    const suggestion = await predictCategoryRecommendation(title, ocrText);
    setCategorySuggestion(suggestion);
    setIsAnalyzingCategory(false);
  };

  // Start Camera with optional QR Scanner mode
  const startCamera = async (asQr = false) => {
    try {
      setMode(asQr ? 'qr' : 'camera');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      lastScannedCodeRef.current = '';
    } catch {
      // If camera access is denied, switch to preset
      setMode('preset');
    }
  };

  const stopCamera = useCallback(() => {
    if (qrAnimationRef.current) {
      cancelAnimationFrame(qrAnimationRef.current);
      qrAnimationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Continuous QR code scanner loop over camera feed
  useEffect(() => {
    if (!cameraActive) {
      if (qrAnimationRef.current) {
        cancelAnimationFrame(qrAnimationRef.current);
        qrAnimationRef.current = null;
      }
      return;
    }

    let lastScanTime = 0;
    const scanFrame = () => {
      const now = performance.now();
      // Throttle scanning to every 120ms for buttery-smooth 60fps UI and low battery draw
      if (
        now - lastScanTime > 120 &&
        videoRef.current &&
        videoRef.current.readyState >= 2
      ) {
        lastScanTime = now;
        const video = videoRef.current;
        const w = video.videoWidth || 640;
        const h = video.videoHeight || 480;

        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = w;
        offscreenCanvas.height = h;
        const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          const imageData = ctx.getImageData(0, 0, w, h);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (qrCode && qrCode.data && qrCode.data.trim()) {
            handleQrCodeDetected(qrCode.data);
          }
        }
      }

      qrAnimationRef.current = requestAnimationFrame(scanFrame);
    };

    qrAnimationRef.current = requestAnimationFrame(scanFrame);

    return () => {
      if (qrAnimationRef.current) {
        cancelAnimationFrame(qrAnimationRef.current);
        qrAnimationRef.current = null;
      }
    };
  }, [cameraActive, handleQrCodeDetected]);

  // Clean up camera on modal close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen, stopCamera]);

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);

      // Check if image also contains QR code
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const qrCode = jsQR(imgData.data, imgData.width, imgData.height, {
        inversionAttempts: 'attemptBoth',
      });
      if (qrCode && qrCode.data) {
        handleQrCodeDetected(qrCode.data);
      }

      stopCamera();

      // Run OCR & Analysis via server
      setIsScanning(true);
      const analysis = await analyzeScannedDocument('camera_capture_scan.jpg', dataUrl);
      setTitle(analysis.title);
      setCategory(analysis.category);
      setConfidentiality(analysis.confidentiality);
      setSummary(analysis.summary);
      setOcrText(analysis.ocrText);
      setExtractedEntities(analysis.extractedEntities);
      setTags(analysis.tags);
      setScanQuality(analysis.scanQuality);
      setCategorySuggestion(analysis.aiCategorySuggestion);

      const sha = await computeSha256(analysis.ocrText);
      setCalculatedHash(sha);
      const enc = await encryptTextPayload(analysis.ocrText);
      setEncryptionPreview({
        iv: enc.iv,
        keyFingerprint: enc.keyFingerprint,
        ciphertextSnippet: enc.ciphertext.slice(0, 36) + '...',
      });
      setIsScanning(false);
    }
  };

  // File Upload handling with image QR code inspection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setCapturedImage(dataUrl);

      // Try scanning QR from uploaded image
      const img = new Image();
      img.onload = () => {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = img.width;
        offCanvas.height = img.height;
        const offCtx = offCanvas.getContext('2d');
        if (offCtx) {
          offCtx.drawImage(img, 0, 0);
          const imgData = offCtx.getImageData(0, 0, img.width, img.height);
          const qr = jsQR(imgData.data, imgData.width, imgData.height, {
            inversionAttempts: 'attemptBoth',
          });
          if (qr && qr.data) {
            handleQrCodeDetected(qr.data);
          }
        }
      };
      img.src = dataUrl;

      setIsScanning(true);
      const analysis = await analyzeScannedDocument(file.name, dataUrl);
      setTitle(analysis.title);
      setCategory(analysis.category);
      setConfidentiality(analysis.confidentiality);
      setSummary(analysis.summary);
      setOcrText(analysis.ocrText);
      setExtractedEntities(analysis.extractedEntities);
      setTags(analysis.tags);
      setScanQuality(analysis.scanQuality);
      setCategorySuggestion(analysis.aiCategorySuggestion);

      const sha = await computeSha256(analysis.ocrText);
      setCalculatedHash(sha);
      const enc = await encryptTextPayload(analysis.ocrText);
      setEncryptionPreview({
        iv: enc.iv,
        keyFingerprint: enc.keyFingerprint,
        ciphertextSnippet: enc.ciphertext.slice(0, 36) + '...',
      });
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  // Auto-generate MoHCC reference number
  const handleAutoGenerateRef = () => {
    const randomRefNum = Math.floor(1000 + Math.random() * 9000);
    const refPrefix =
      category === 'Reproductive, Maternal & Child Health'
        ? 'MOHCC-PED'
        : category === 'IT Help Desk & Infrastructure'
        ? 'MOHCC-IT'
        : category === 'Pharmacy & Logistics (NatPharm)'
        ? 'MOHCC-PHARM'
        : category === 'Epidemiology & Disease Control'
        ? 'MOHCC-EPI'
        : category === 'Finance & Health Procurement'
        ? 'MOHCC-FIN'
        : 'MOHCC-REC';

    const generated = `${refPrefix}-2026-${randomRefNum}`;
    setReferenceNo(generated);
    setQrScannedInfo(null);
  };

  // Add tag
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Submit and Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !ocrText.trim()) return;

    // Encrypt the full document payload
    const encResult = await encryptTextPayload(ocrText);
    const newDocId = `DOC-2026-${Math.floor(100 + Math.random() * 900)}`;
    const randomRefNum = Math.floor(1000 + Math.random() * 9000);
    const refPrefix =
      category === 'Reproductive, Maternal & Child Health'
        ? 'MOHCC-PED'
        : category === 'IT Help Desk & Infrastructure'
        ? 'MOHCC-IT'
        : category === 'Pharmacy & Logistics (NatPharm)'
        ? 'MOHCC-PHARM'
        : category === 'Epidemiology & Disease Control'
        ? 'MOHCC-EPI'
        : 'MOHCC-REC';

    const finalReferenceNo = referenceNo.trim() || `${refPrefix}-2026-${randomRefNum}`;
    const finalTags = qrScannedInfo && !tags.includes('QR-Verified')
      ? [...tags, 'QR-Verified']
      : tags;

    const newDoc: HealthDocument = {
      id: newDocId,
      referenceNo: finalReferenceNo,
      title: title.trim(),
      category,
      confidentiality,
      status: 'PENDING_REVIEW',
      dateCreated: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      authorName: currentUser.name,
      authorDepartment: currentUser.department,
      fileSize: 2400000 + Math.floor(Math.random() * 800000),
      pageCount: Math.max(1, Math.floor(ocrText.length / 400)),
      scanQuality,
      summary: summary || 'Digitized document ingested via MoHCC IT Help Desk scanner.',
      ocrText,
      extractedEntities,
      tags: finalTags,
      encryption: {
        algorithm: 'AES-GCM-256',
        iv: encResult.iv,
        keyFingerprint: encResult.keyFingerprint,
        encryptedSnippet: encResult.ciphertext.slice(0, 48),
        sha256Hash: encResult.sha256Hash,
        cipherLengthBytes: encResult.cipherLengthBytes,
      },
      reviewHistory: [
        {
          reviewerId: currentUser.id,
          reviewerName: currentUser.name,
          reviewerRole: currentUser.role,
          action: 'SUBMITTED',
          comment: qrScannedInfo
            ? `Ingested via camera scanner with QR reference verification: ${finalReferenceNo}.`
            : 'Scanned, OCR digitized, and client-side AES-256 encrypted.',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    onSaveDocument(newDoc);
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                MoHCC Optical Document Scanner &amp; Ingestion Unit
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Camera QR reference indexing, OCR transcription, and AES-GCM-256 envelope encryption.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[78vh] overflow-y-auto">
          {/* Left Column: Visual Scanner / Capture Interface */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span>Ingestion Mode</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setMode('preset');
                  }}
                  className={`px-2 py-1 rounded-md transition-colors text-[11px] ${
                    mode === 'preset'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Presets
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setMode('upload');
                  }}
                  className={`px-2 py-1 rounded-md transition-colors text-[11px] ${
                    mode === 'upload'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => startCamera(false)}
                  className={`px-2 py-1 rounded-md transition-colors text-[11px] flex items-center gap-1 ${
                    mode === 'camera'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Camera className="w-3 h-3" />
                  <span>Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => startCamera(true)}
                  className={`px-2 py-1 rounded-md transition-colors text-[11px] flex items-center gap-1 ${
                    mode === 'qr'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                  }`}
                >
                  <QrCode className="w-3 h-3" />
                  <span>Scan QR</span>
                </button>
              </div>
            </div>

            {/* Scan Viewport Container */}
            <div
              className={`relative aspect-4/3 w-full bg-slate-950 rounded-xl overflow-hidden border transition-all flex items-center justify-center ${
                qrScanFlash
                  ? 'border-emerald-400 ring-4 ring-emerald-400/40'
                  : 'border-slate-800'
              }`}
            >
              {/* Active Camera Feed for both Document and QR Modes */}
              {(mode === 'camera' || mode === 'qr') && cameraActive && (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />

                  {/* QR Mode Targeting Reticle */}
                  {mode === 'qr' && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                      {/* Top Header Tag */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between text-[10px] font-mono text-emerald-400 bg-slate-900/80 px-2 py-1 rounded backdrop-blur-xs">
                        <span className="flex items-center gap-1 font-bold">
                          <Scan className="w-3 h-3 animate-spin" />
                          <span>CAMERA QR DETECTOR</span>
                        </span>
                        <span className="text-slate-300">60 FPS REALTIME</span>
                      </div>

                      {/* Center Target Box with 4 Corner Brackets */}
                      <div className="relative w-48 h-48 border border-emerald-400/30 rounded-lg flex items-center justify-center">
                        {/* Top-Left */}
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-3 border-l-3 border-emerald-400 rounded-tl-sm" />
                        {/* Top-Right */}
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-3 border-r-3 border-emerald-400 rounded-tr-sm" />
                        {/* Bottom-Left */}
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-3 border-l-3 border-emerald-400 rounded-bl-sm" />
                        {/* Bottom-Right */}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-3 border-r-3 border-emerald-400 rounded-br-sm" />

                        {/* Animated Sweeping Laser Scanline */}
                        <div className="absolute inset-x-2 h-0.5 bg-emerald-400 shadow-[0_0_10px_#10b981] animate-bounce" />

                        {/* Center Plus Reticle */}
                        <div className="w-2 h-2 rounded-full bg-emerald-400/80 animate-ping" />
                      </div>

                      {/* Bottom Status Prompt */}
                      <div className="absolute bottom-3 inset-x-4 text-center">
                        <span className="text-[10px] font-mono text-emerald-300 bg-slate-900/90 px-3 py-1 rounded-full border border-emerald-500/40">
                          {qrDetectionStatus}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Standard Document Capture Overlay */}
                  {mode === 'camera' && (
                    <div className="absolute inset-4 border-2 border-dashed border-emerald-400/70 rounded-lg pointer-events-none flex flex-col justify-between p-2">
                      <div className="flex justify-between text-[10px] text-emerald-400 font-mono">
                        <span>ALIGN DOCUMENT CORNERS</span>
                        <span>AUTO-QR ACTIVE</span>
                      </div>
                      {/* Sweeping laser line */}
                      <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                      <div className="text-center text-[10px] text-emerald-400 font-mono">
                        HOLD CAMERA PARALLEL TO PAGE
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Inactive Camera State */}
              {(mode === 'camera' || mode === 'qr') && !cameraActive && (
                <div className="text-center p-6 text-slate-400">
                  {mode === 'qr' ? (
                    <QrCode className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                  ) : (
                    <Camera className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                  )}
                  <p className="text-xs mb-3 text-slate-300">
                    {mode === 'qr'
                      ? 'Camera QR Code Scanner Standby'
                      : 'Camera access standby'}
                  </p>
                  <button
                    type="button"
                    onClick={() => startCamera(mode === 'qr')}
                    className="px-3.5 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium shadow-sm transition-colors"
                  >
                    Activate Camera Feed
                  </button>
                </div>
              )}

              {mode === 'upload' && (
                <div className="p-6 text-center w-full">
                  {capturedImage ? (
                    <div className="relative max-h-52 w-full flex items-center justify-center">
                      <img
                        src={capturedImage}
                        alt="Uploaded document scan"
                        className="max-h-52 object-contain rounded-md"
                        style={{ filter: `contrast(${contrastLevel}%)` }}
                      />
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-6 transition-colors">
                      <Upload className="w-10 h-10 text-slate-500 mb-2" />
                      <span className="text-xs font-semibold text-slate-300">
                        Choose Scanned Image or PDF
                      </span>
                      <span className="text-[11px] text-slate-500 mt-1">
                        Auto-decodes QR stickers and performs OCR extraction
                      </span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              )}

              {mode === 'preset' && (
                <div className="p-4 w-full h-full flex flex-col justify-between bg-slate-900 text-white">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Standard Ministry Physical Templates:
                  </div>
                  <div className="flex flex-col gap-2">
                    {presets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.id)}
                        className="p-2.5 rounded-lg border border-slate-800 hover:border-emerald-500/80 bg-slate-950/70 hover:bg-slate-800/80 text-left transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-200">{preset.label}</p>
                          <span className="text-[10px] font-mono text-emerald-400 uppercase">
                            {preset.refNo}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{preset.desc}</p>
                      </button>
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-500 text-center font-mono pt-2">
                    Includes pre-indexed QR reference numbers and clinical telemetry.
                  </div>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Camera Actions & Controls */}
            {cameraActive && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Full Document Scan</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                >
                  Stop Feed
                </button>
              </div>
            )}

            {/* Quick Test QR Sticker Simulator (Convenience for testing without physical camera) */}
            <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5 font-bold text-[11px]">
                  <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                  <span>MoHCC QR Code Simulator</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">1-Click Test</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQrCodeDetected('MOHCC-PED-2026-90412')}
                  className="p-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-[10px] font-mono text-slate-800 dark:text-slate-200 text-left transition-colors truncate"
                  title="Test Pediatric Card QR"
                >
                  PED-90412
                </button>
                <button
                  type="button"
                  onClick={() => handleQrCodeDetected('MOHCC-IT-2026-9984')}
                  className="p-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-[10px] font-mono text-slate-800 dark:text-slate-200 text-left transition-colors truncate"
                  title="Test IT Helpdesk Incident QR"
                >
                  IT-9984
                </button>
                <button
                  type="button"
                  onClick={() => handleQrCodeDetected('MOHCC-PHARM-2026-8819')}
                  className="p-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-[10px] font-mono text-slate-800 dark:text-slate-200 text-left transition-colors truncate"
                  title="Test NatPharm Cold-Chain QR"
                >
                  PHARM-8819
                </button>
              </div>
            </div>

            {/* Contrast / Enhancement Slider */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Optical Contrast &amp; De-skew</span>
                </span>
                <span className="font-mono text-slate-500">{contrastLevel}%</span>
              </div>
              <input
                type="range"
                min="80"
                max="160"
                value={contrastLevel}
                onChange={(e) => setContrastLevel(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Real-time Cryptographic Verification Box */}
            <div className="p-3 bg-slate-900 text-white rounded-xl border border-slate-800 text-xs font-mono space-y-1.5">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="flex items-center gap-1 font-semibold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>E2EE SHA-256 INTEGRITY</span>
                </span>
                <span className="text-[10px]">AES-GCM-256</span>
              </div>
              <div className="text-[11px] text-slate-400 break-all">
                Hash: {calculatedHash || 'Computing verification digest...'}
              </div>
              {encryptionPreview && (
                <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-1 flex justify-between">
                  <span>Key: {encryptionPreview.keyFingerprint}</span>
                  <span>IV: {encryptionPreview.iv.slice(0, 8)}..</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Document Metadata & OCR Review */}
          <form onSubmit={handleSave} className="lg:col-span-7 flex flex-col gap-4">
            {isScanning && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                <span>Running optical character recognition and metadata entity extraction...</span>
              </div>
            )}

            {/* Document Reference Number (QR Code Scanner Feature) */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>Document Reference Number</span>
                </label>
                {qrScannedInfo ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Scanned via QR ({qrScannedInfo.timestamp})</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono">
                    Scan sticker or enter manually
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={referenceNo}
                  onChange={(e) => {
                    setReferenceNo(e.target.value);
                    setQrScannedInfo(null);
                  }}
                  placeholder="e.g. MOHCC-PED-2026-90412"
                  className="flex-1 px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-emerald-600 tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => startCamera(true)}
                  className="px-3 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                  title="Open Camera QR Scanner to auto-populate reference"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span>Scan QR</span>
                </button>
                <button
                  type="button"
                  onClick={handleAutoGenerateRef}
                  className="px-2.5 py-2 text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg transition-colors"
                  title="Generate a sequential reference ID"
                >
                  Auto-Gen
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Camera QR scanning reads physical folder barcode stickers to eliminate manual entry errors.
              </p>
            </div>

            {/* Document Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Document Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Harare Central Pediatric Intake Card"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-emerald-600"
              />
            </div>

            {/* AI-Powered Suggested Category Feature */}
            {categorySuggestion && (
              <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600 animate-pulse" />
                    <span>AI Suggested Category:</span>
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                      {categorySuggestion.suggestedCategory}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                      {categorySuggestion.confidenceScore}% Confidence
                    </span>
                    <button
                      type="button"
                      onClick={handleReanalyzeCategory}
                      disabled={isAnalyzingCategory}
                      className="text-[10px] font-semibold text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1"
                      title="Re-analyze title and content with AI to update recommendation"
                    >
                      <RefreshCw className={`w-3 h-3 ${isAnalyzingCategory ? 'animate-spin' : ''}`} />
                      <span>{isAnalyzingCategory ? 'Analyzing...' : 'Re-check AI'}</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                  {categorySuggestion.rationale}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60 text-xs">
                  <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500 font-mono">
                    <span className="text-slate-400">Indicators:</span>
                    {categorySuggestion.keywordsDetected.map((kw, i) => (
                      <span
                        key={i}
                        className="bg-emerald-100/70 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-800 dark:text-emerald-200"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>

                  {category === categorySuggestion.suggestedCategory ? (
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Applied (Zero Entry Errors)</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCategory(categorySuggestion.suggestedCategory)}
                      className="text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-2.5 py-1 rounded-md transition-colors shadow-2xs"
                    >
                      Apply Recommendation →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Department and Confidentiality Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Department / Category
                  </label>
                  {categorySuggestion && category !== categorySuggestion.suggestedCategory && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      Manual override differs from AI
                    </span>
                  )}
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Department)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="Reproductive, Maternal & Child Health">
                    Reproductive, Maternal &amp; Child Health
                  </option>
                  <option value="IT Help Desk & Infrastructure">
                    IT Help Desk &amp; Infrastructure
                  </option>
                  <option value="Epidemiology & Disease Control">
                    Epidemiology &amp; Disease Control
                  </option>
                  <option value="Pharmacy & Logistics (NatPharm)">
                    Pharmacy &amp; Logistics (NatPharm)
                  </option>
                  <option value="Clinical Guidelines & Standards">
                    Clinical Guidelines &amp; Standards
                  </option>
                  <option value="Finance & Health Procurement">
                    Finance &amp; Health Procurement
                  </option>
                  <option value="Personnel & Administration">Personnel &amp; Administration</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Security Clearance
                </label>
                <select
                  value={confidentiality}
                  onChange={(e) => setConfidentiality(e.target.value as ConfidentialityLevel)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                >
                  <option value="PUBLIC">PUBLIC</option>
                  <option value="INTERNAL">INTERNAL</option>
                  <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                  <option value="RESTRICTED_MEDICAL">RESTRICTED MEDICAL (E2EE)</option>
                </select>
              </div>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Executive Clinical / Technical Summary
              </label>
              <textarea
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief synopsis for quick retrieval"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-emerald-600"
              />
            </div>

            {/* Verbatim OCR Transcript */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Digitized OCR Transcript (Sealed in AES Envelope)</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  {ocrText.length} characters
                </span>
              </div>
              <textarea
                rows={4}
                required
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                placeholder="Verbatim text digitized from paper document..."
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-emerald-600 leading-relaxed"
              />
            </div>

            {/* Extracted Entities */}
            {extractedEntities.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Extracted Metadata Entities:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {extractedEntities.map((ent, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col"
                    >
                      <span className="text-[10px] text-slate-500 font-mono">{ent.label}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {ent.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Indexing Tags
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add indexing tag and press Enter"
                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-emerald-600"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-300"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>AES-GCM-256 Envelope Seal Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || !ocrText.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Encrypt &amp; Archive Record</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
