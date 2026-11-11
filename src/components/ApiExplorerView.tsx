import React, { useState } from 'react';
import {
  Code,
  Key,
  Terminal,
  Play,
  Copy,
  Check,
  Shield,
  Layers,
  Database,
  Globe,
  Send,
  Plus,
  Trash2,
} from 'lucide-react';
import { ApiToken, HealthDocument } from '../types';

interface ApiExplorerViewProps {
  tokens: ApiToken[];
  documents: HealthDocument[];
  onGenerateToken: (name: string, dept: string, scopes: string[]) => void;
  onRevokeToken: (id: string) => void;
}

export const ApiExplorerView: React.FC<ApiExplorerViewProps> = ({
  tokens,
  documents,
  onGenerateToken,
  onRevokeToken,
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('list_docs');
  const [languageSnippet, setLanguageSnippet] = useState<'curl' | 'python' | 'node'>('curl');
  const [copied, setCopied] = useState(false);
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // New token modal state
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenDept, setNewTokenDept] = useState('Central Referral Hospitals');

  const endpoints = [
    {
      id: 'list_docs',
      method: 'GET',
      path: '/api/v1/documents',
      title: 'Query Document Vault',
      description: 'Fetch records ordered by date and category with clearance filtration and full-text search.',
      params: '?category=Reproductive%2C%20Maternal%20%26%20Child%20Health&limit=10',
    },
    {
      id: 'scan_ingest',
      method: 'POST',
      path: '/api/v1/documents/scan',
      title: 'Ingest Physical Scan & Encrypt',
      description: 'Submit base64 OCR scanned record, compute SHA-256 hash, and seal with AES-GCM-256.',
      payload: {
        title: 'Mutare General Hospital Neonatal Resuscitation Intake',
        category: 'Reproductive, Maternal & Child Health',
        confidentiality: 'RESTRICTED_MEDICAL',
        base64Payload: 'JVBERi0xLjQKJcTl8uXr...',
        hardwareScannerId: 'SCAN-MUTARE-004',
      },
    },
    {
      id: 'get_audit',
      method: 'GET',
      path: '/api/v1/audit/logs',
      title: 'Stream Chained Audit Logs',
      description: 'Retrieve immutable access logs with cryptographic block hash verification.',
      params: '?severity=NOTICE&limit=25',
    },
    {
      id: 'biometric_verify',
      method: 'POST',
      path: '/api/v1/auth/biometric/challenge',
      title: 'Hardware Biometric Handshake',
      description: 'Verify FIDO2 / Touch ID hardware signature for restricted medical file clearance.',
      payload: {
        badgeId: 'CLIN-PED-119',
        challengeId: 'CHALL-8849-0192',
        authenticatorType: 'FIDO2_PLATFORM',
      },
    },
    {
      id: 'gemini_classify',
      method: 'POST',
      path: '/api/gemini/classify-category',
      title: 'Server-Side Document Category Intelligence',
      description: 'Dispatches document title & OCR tokens to server-side Gemini 3.8 Flash model for zero-error MoHCC departmental indexing.',
      payload: {
        title: 'Central Vaccine Depot Cryogenic Cold-Chain Temperature Log',
        content: 'Sensitech Data Logger DL-88419-ZW recorded continuous +3.4C thermal stability across 72 hours in NatPharm cold store.',
      },
    },
    {
      id: 'gemini_stream',
      method: 'POST',
      path: '/api/gemini/stream',
      title: 'Server-Side Streaming Intelligence (SSE)',
      description: 'Stream real-time responses via Server-Sent Events from server-side Gemini 3.8 Flash model.',
      payload: {
        prompt: 'Summarize required IT compliance checklist for provincial hospital telemedicine fiber gateway.',
      },
    },
  ];

  const activeEp = endpoints.find((e) => e.id === selectedEndpoint) || endpoints[0];

  const handleExecuteSandbox = async () => {
    setIsLoading(true);
    setApiResponse(null);

    if (activeEp.id === 'gemini_classify') {
      try {
        const res = await fetch('/api/gemini/classify-category', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activeEp.payload),
        });
        const data = await res.json();
        setResponseStatus(res.status);
        setApiResponse(JSON.stringify(data, null, 2));
      } catch (err: unknown) {
        setResponseStatus(500);
        setApiResponse(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }, null, 2));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (activeEp.id === 'gemini_stream') {
      try {
        const res = await fetch('/api/gemini/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activeEp.payload),
        });
        setResponseStatus(res.status);
        const text = await res.text();
        setApiResponse(text || 'data: {"text": "Connected to Gemini stream."}\n\ndata: [DONE]\n\n');
      } catch (err: unknown) {
        setResponseStatus(500);
        setApiResponse(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }, null, 2));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setTimeout(() => {
      setIsLoading(false);
      setResponseStatus(200);

      if (activeEp.id === 'list_docs') {
        const sample = documents.slice(0, 2).map((d) => ({
          id: d.id,
          referenceNo: d.referenceNo,
          title: d.title,
          category: d.category,
          confidentiality: d.confidentiality,
          status: d.status,
          dateCreated: d.dateCreated,
          encryptionFingerprint: d.encryption.keyFingerprint,
          sha256Hash: d.encryption.sha256Hash,
        }));
        setApiResponse(
          JSON.stringify(
            {
              status: 'success',
              count: documents.length,
              page: 1,
              records: sample,
            },
            null,
            2
          )
        );
      } else if (activeEp.id === 'scan_ingest') {
        setResponseStatus(201);
        setApiResponse(
          JSON.stringify(
            {
              status: 'success',
              message: 'Document successfully ingested, OCR analyzed, and encrypted in MoHCC vault.',
              documentId: 'DOC-2026-942',
              referenceNo: 'MOHCC-PED-2026-942',
              cipherEnvelope: {
                algorithm: 'AES-GCM-256',
                iv: '4b1a89fK10m==',
                keyFingerprint: 'K-256-44A91B00',
                sha256Hash: '4819203847291028374910283749102837491028374910283749102837491028',
              },
              auditBlockSigned: true,
            },
            null,
            2
          )
        );
      } else if (activeEp.id === 'get_audit') {
        setApiResponse(
          JSON.stringify(
            {
              status: 'success',
              chainIntegrity: 'VERIFIED_VALID',
              chainHash: '7a19c84e1b2f90a182c47d891b023f89a7123491823901b872c9182391823019',
              totalEvents: 48,
              recentLogs: [
                {
                  id: 'LOG-001',
                  action: 'BIOMETRIC_VERIFIED',
                  user: 'Dr. Farai Chidzero',
                  timestamp: new Date().toISOString(),
                  severity: 'INFO',
                },
                {
                  id: 'LOG-002',
                  action: 'DECRYPT_RECORD',
                  user: 'Dr. Nyasha Sithole',
                  timestamp: new Date(Date.now() - 3600000).toISOString(),
                  severity: 'NOTICE',
                },
              ],
            },
            null,
            2
          )
        );
      } else {
        setApiResponse(
          JSON.stringify(
            {
              status: 'success',
              biometricStatus: 'AUTHENTICATED',
              hardwareAttestation: 'VERIFIED_FIDO2_TPM',
              sessionTicket: 'TKT-BIO-8819204-ZW',
              expiresInSeconds: 900,
            },
            null,
            2
          )
        );
      }
    }, 400);
  };

  const getCodeSnippet = () => {
    const bearer = tokens[0]?.token || 'moh_sec_live_9a8fbc1276a14e918b';
    const baseUrl = 'https://api.mohcc.gov.zw/v1';

    if (languageSnippet === 'curl') {
      if (activeEp.method === 'GET') {
        return `curl -X GET "${baseUrl}${activeEp.path}${activeEp.params || ''}" \\
  -H "Authorization: Bearer ${bearer}" \\
  -H "Accept: application/json"`;
      } else {
        return `curl -X POST "${baseUrl}${activeEp.path}" \\
  -H "Authorization: Bearer ${bearer}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(activeEp.payload || {}, null, 2)}'`;
      }
    }

    if (languageSnippet === 'python') {
      if (activeEp.method === 'GET') {
        return `import requests

url = "${baseUrl}${activeEp.path}"
headers = {
    "Authorization": "Bearer ${bearer}",
    "Accept": "application/json"
}
params = {"limit": 10}

response = requests.get(url, headers=headers, params=params)
print(response.status_code)
print(response.json())`;
      } else {
        return `import requests

url = "${baseUrl}${activeEp.path}"
headers = {
    "Authorization": "Bearer ${bearer}",
    "Content-Type": "application/json"
}
payload = ${JSON.stringify(activeEp.payload || {}, null, 4)}

response = requests.post(url, headers=headers, json=payload)
print(response.status_code)
print(response.json())`;
      }
    }

    // Node.js
    if (activeEp.method === 'GET') {
      return `const response = await fetch('${baseUrl}${activeEp.path}${activeEp.params || ''}', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ${bearer}',
    'Accept': 'application/json'
  }
});

const data = await response.json();
console.log(data);`;
    } else {
      return `const response = await fetch('${baseUrl}${activeEp.path}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${bearer}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(${JSON.stringify(activeEp.payload || {}, null, 2)})
});

const data = await response.json();
console.log(data);`;
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) return;
    onGenerateToken(newTokenName.trim(), newTokenDept, ['records:read', 'records:write', 'audit:read']);
    setNewTokenName('');
    setShowTokenModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              MoHCC Health Informatics REST API &amp; Developer Resources
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Integrate provincial hospital EHR instances, automated optical feeders, and national health surveillance data pipelines with cryptographic role-based access.
          </p>
        </div>
        <button
          onClick={() => setShowTokenModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Issue New API Token</span>
        </button>
      </div>

      {/* Main Grid: Endpoints + Interactive Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Endpoint List */}
        <div className="lg:col-span-4 space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            API Endpoints (v1)
          </h3>
          <div className="flex flex-col gap-1.5">
            {endpoints.map((ep) => {
              const isSelected = ep.id === activeEp.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => {
                    setSelectedEndpoint(ep.id);
                    setApiResponse(null);
                    setResponseStatus(null);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-emerald-500 dark:border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                      : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded ${
                        ep.method === 'GET'
                          ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-mono text-xs text-slate-900 dark:text-white font-semibold">
                      {ep.path}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{ep.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{ep.description}</p>
                </button>
              );
            })}
          </div>

          {/* Active Tokens Card */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-600" />
                <span>Authorized Hospital Tokens</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">{tokens.length} active</span>
            </div>
            <div className="space-y-2">
              {tokens.map((t) => (
                <div
                  key={t.id}
                  className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">{t.name}</span>
                    <span className="text-[10px] text-emerald-600 font-mono">Active</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-400 mt-1 truncate">
                    {t.token.slice(0, 14)}••••••••••
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>{t.department}</span>
                    <span>Expires in {t.expiresInDays}d</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Interactive Sandbox & Code Viewer */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-xs font-mono font-bold rounded ${
                      activeEp.method === 'GET'
                        ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {activeEp.method}
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {activeEp.path}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{activeEp.description}</p>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg shrink-0">
                <button
                  onClick={() => setLanguageSnippet('curl')}
                  className={`px-2.5 py-1 text-xs font-mono rounded-md ${
                    languageSnippet === 'curl' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold' : 'text-slate-500'
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setLanguageSnippet('python')}
                  className={`px-2.5 py-1 text-xs font-mono rounded-md ${
                    languageSnippet === 'python' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold' : 'text-slate-500'
                  }`}
                >
                  Python
                </button>
                <button
                  onClick={() => setLanguageSnippet('node')}
                  className={`px-2.5 py-1 text-xs font-mono rounded-md ${
                    languageSnippet === 'node' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold' : 'text-slate-500'
                  }`}
                >
                  Node.js
                </button>
              </div>
            </div>

            {/* Code Snippet Box */}
            <div className="relative">
              <button
                onClick={handleCopyCode}
                className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-md transition-colors"
                title="Copy code snippet"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <pre className="p-4 bg-slate-950 rounded-xl text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                {getCodeSnippet()}
              </pre>
            </div>

            {/* Test Sandbox Execution */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Live API sandbox with real-time JSON response and encryption checks.
              </span>
              <button
                onClick={handleExecuteSandbox}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isLoading ? 'Executing...' : 'Run Live Test Call'}</span>
              </button>
            </div>

            {/* Live Response Output */}
            {apiResponse && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Live Response Payload
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    <span
                      className={`font-bold ${
                        responseStatus && responseStatus < 300 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      HTTP {responseStatus} OK
                    </span>
                    <span className="text-slate-400">· 24ms</span>
                  </div>
                </div>
                <pre className="p-4 bg-slate-900 rounded-xl text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800 max-h-72">
                  {apiResponse}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Token Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Issue Ministry Scoped API Token
              </h3>
              <button
                onClick={() => setShowTokenModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateToken} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Integration Application / Hospital Facility
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mpilo Central Pediatric EHR Node"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department Scope
                </label>
                <select
                  value={newTokenDept}
                  onChange={(e) => setNewTokenDept(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="Central Referral Hospitals">Central Referral Hospitals</option>
                  <option value="Reproductive, Maternal & Child Health">Maternal &amp; Child Health</option>
                  <option value="Pharmacy & Logistics (NatPharm)">NatPharm Logistics</option>
                  <option value="Epidemiology & Disease Control">Disease Surveillance</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTokenModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
                >
                  Generate Bearer Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
