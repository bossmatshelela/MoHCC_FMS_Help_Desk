import React, { useState, useEffect } from 'react';
import {
  FileText,
  ShieldCheck,
  Clock,
  Sparkles,
  TreeDeciduous,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
  Lock,
  ArrowRight,
  HardDrive,
  Users,
  Activity,
  Cpu,
  Database,
  Zap,
  Play,
  Pause,
  Calendar,
  BarChart2,
  LineChart,
  PieChart,
} from 'lucide-react';
import { HealthDocument, UserProfile, DocumentStatus, SystemTelemetry } from '../types';

interface DashboardViewProps {
  documents: HealthDocument[];
  currentUser: UserProfile;
  onSelectDocument: (doc: HealthDocument) => void;
  onOpenScanner: () => void;
  onSelectTab: (tab: 'dashboard' | 'documents' | 'audit' | 'api') => void;
  onOpenRbacManager?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  documents,
  currentUser,
  onSelectDocument,
  onOpenScanner,
  onSelectTab,
  onOpenRbacManager,
}) => {
  // Widget customization settings
  const [showTelemetry, setShowTelemetry] = useState(true);
  const [showThroughputChart, setShowThroughputChart] = useState(true);
  const [showDeadlines, setShowDeadlines] = useState(true);
  const [showCategoryBreakdown, setShowCategoryBreakdown] = useState(true);
  const [showPendingQueue, setShowPendingQueue] = useState(true);
  const [timeHorizon, setTimeHorizon] = useState<'live' | '24h' | '7d' | '30d'>('live');
  const [chartStyle, setChartStyle] = useState<'bar' | 'line' | 'metric'>('line');
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);

  // Live System Telemetry State
  const [telemetry, setTelemetry] = useState<SystemTelemetry>({
    cpuUsage: 22,
    memoryUsageMb: 3420,
    memoryMaxMb: 8192,
    dbLatencyMs: 12,
    throughputReqSec: 184,
    encryptionSpeedMbSec: 46.8,
    uptimeSeconds: 842100,
    activeSessions: 14,
    slaCompliancePercent: 97.4,
  });

  // Dynamic live fluctuation simulation
  useEffect(() => {
    if (!isLiveStreaming) return;
    const interval = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        cpuUsage: Math.min(85, Math.max(14, prev.cpuUsage + (Math.floor(Math.random() * 7) - 3))),
        memoryUsageMb: Math.min(6200, Math.max(3100, prev.memoryUsageMb + (Math.floor(Math.random() * 40) - 20))),
        dbLatencyMs: Math.min(28, Math.max(8, prev.dbLatencyMs + (Math.floor(Math.random() * 3) - 1))),
        throughputReqSec: Math.min(320, Math.max(120, prev.throughputReqSec + (Math.floor(Math.random() * 15) - 7))),
        encryptionSpeedMbSec: Number((prev.encryptionSpeedMbSec + (Math.random() * 2 - 1)).toFixed(1)),
        uptimeSeconds: prev.uptimeSeconds + 3,
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  // Compute Document Metrics
  const totalDocs = documents.length;
  const pendingDocs = documents.filter((d) => d.status === 'PENDING_REVIEW');
  const approvedDocs = documents.filter((d) => d.status === 'APPROVED');
  const restrictedDocs = documents.filter((d) => d.confidentiality === 'RESTRICTED_MEDICAL');
  const totalPages = documents.reduce((sum, d) => sum + d.pageCount, 0);
  const totalBytes = documents.reduce((sum, d) => sum + d.fileSize, 0);

  // Paper sheets saved estimate (48 pages per physical folder + 3 copies)
  const estimatedPaperSheetsSaved = (totalPages * 4.2).toLocaleString(undefined, { maximumFractionDigits: 0 });

  // Category counts
  const categoryCounts = documents.reduce((acc, doc) => {
    acc[doc.category] = (acc[doc.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Deadlines list
  const upcomingDeadlines = [
    {
      id: 'DL-01',
      title: 'Maternal Death Surveillance & Response (MDSR) Audit #059',
      docRef: 'MOHCC-RMNCH-2026-059',
      targetDocId: 'DOC-2026-004',
      due: '2026-11-12T16:00:00Z',
      hoursLeft: 28,
      status: 'URGENT',
      department: 'Reproductive, Maternal & Child Health',
    },
    {
      id: 'DL-02',
      title: 'Mbare Pediatric Health Growth Cards Batch Signoff',
      docRef: 'MOHCC-PED-2026-309',
      targetDocId: 'DOC-2026-008',
      due: '2026-11-13T12:00:00Z',
      hoursLeft: 48,
      status: 'PENDING_CLINICAL',
      department: 'Reproductive, Maternal & Child Health',
    },
    {
      id: 'DL-03',
      title: 'Primary Care Biometric Kiosk Hardware Procurement Concurrence',
      docRef: 'MOHCC-PROC-2026-077',
      targetDocId: 'DOC-2026-006',
      due: '2026-11-15T17:00:00Z',
      hoursLeft: 102,
      status: 'REVISION_WINDOW',
      department: 'Finance & Health Procurement',
    },
  ];

  // Live throughput curve data points
  const liveThroughputPoints = [
    { time: '11:35', reqs: 142, latency: 14, mb: 12 },
    { time: '11:36', reqs: 188, latency: 11, mb: 19 },
    { time: '11:37', reqs: 210, latency: 15, mb: 24 },
    { time: '11:38', reqs: 165, latency: 13, mb: 16 },
    { time: '11:39', reqs: 195, latency: 12, mb: 22 },
    { time: '11:40', reqs: telemetry.throughputReqSec, latency: telemetry.dbLatencyMs, mb: 28 },
  ];
  const maxReqs = 250;

  return (
    <div className="space-y-6">
      {/* Hero Operational Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-white shadow-md">
        <div className="absolute inset-0 z-0 opacity-25">
          <img
            src="/src/assets/images/medical_records_vault_1794339730785.jpg"
            alt="MoHCC IT Vault"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>MoHCC National Health Document Archive · Verified Active · RBAC Strict</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              IT Help Desk &amp; Digital Health Records Command Console
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Paperless document ingestion for provincial hospitals and clinics. Enforces strict role-based access control ('Administrator', 'Help Desk Staff', 'Read-Only Viewer', 'Medical Officer') with automated review notifications and real-time hardware telemetry.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onOpenRbacManager && (
              <button
                onClick={onOpenRbacManager}
                className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Manage RBAC Roles</span>
              </button>
            )}
            <button
              onClick={() => setCustomizerOpen(!customizerOpen)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Personalize Dashboard</span>
            </button>
            <button
              onClick={onOpenScanner}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Scan New Record</span>
            </button>
          </div>
        </div>

        {/* Customizer Drawer */}
        {customizerOpen && (
          <div className="relative z-10 px-6 py-4 border-t border-slate-800 bg-slate-950/95 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-semibold text-slate-400">Personalized Widgets:</span>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={showTelemetry}
                  onChange={(e) => setShowTelemetry(e.target.checked)}
                  className="rounded accent-emerald-500"
                />
                <span>Hardware Telemetry</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={showThroughputChart}
                  onChange={(e) => setShowThroughputChart(e.target.checked)}
                  className="rounded accent-emerald-500"
                />
                <span>Real-Time Throughput</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={showDeadlines}
                  onChange={(e) => setShowDeadlines(e.target.checked)}
                  className="rounded accent-emerald-500"
                />
                <span>Upcoming Deadlines &amp; SLA</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={showCategoryBreakdown}
                  onChange={(e) => setShowCategoryBreakdown(e.target.checked)}
                  className="rounded accent-emerald-500"
                />
                <span>Department Breakdown</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={showPendingQueue}
                  onChange={(e) => setShowPendingQueue(e.target.checked)}
                  className="rounded accent-emerald-500"
                />
                <span>Pending Review Queue</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Time Horizon:</span>
              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg">
                {(['live', '24h', '7d', '30d'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeHorizon(t)}
                    className={`px-2 py-1 rounded text-[11px] font-medium uppercase ${
                      timeHorizon === t ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Real-Time System Performance & Hardware Telemetry (Admin Monitor) */}
      {showTelemetry && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Real-Time IT System Performance &amp; Hardware Telemetry
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={() => setIsLiveStreaming(!isLiveStreaming)}
                className="flex items-center gap-1 text-[11px] font-mono text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                {isLiveStreaming ? (
                  <>
                    <Pause className="w-3 h-3" />
                    <span>Live Streaming (3s Interval)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    <span>Stream Paused</span>
                  </>
                )}
              </button>
              <span className="font-mono text-slate-400 text-[11px]">
                Uptime: {(telemetry.uptimeSeconds / 86400).toFixed(1)}d (99.98%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* CPU Load */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>CPU Cluster</span>
                <Cpu className="w-3.5 h-3.5 text-sky-500" />
              </div>
              <p className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
                {telemetry.cpuUsage}%
              </p>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    telemetry.cpuUsage > 70 ? 'bg-amber-500' : 'bg-sky-500'
                  }`}
                  style={{ width: `${telemetry.cpuUsage}%` }}
                />
              </div>
            </div>

            {/* RAM Memory */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Memory Allocation</span>
                <HardDrive className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <p className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
                {(telemetry.memoryUsageMb / 1024).toFixed(1)} / 8.0 GB
              </p>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full"
                  style={{ width: `${(telemetry.memoryUsageMb / telemetry.memoryMaxMb) * 100}%` }}
                />
              </div>
            </div>

            {/* DB Query Latency */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>DB Query Latency</span>
                <Database className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                {telemetry.dbLatencyMs} ms
              </p>
              <span className="text-[10px] text-slate-400 font-mono">PostgreSQL Index P95</span>
            </div>

            {/* Throughput */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Throughput</span>
                <Zap className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
                {telemetry.throughputReqSec} req/s
              </p>
              <span className="text-[10px] text-slate-400 font-mono">Gateway I/O</span>
            </div>

            {/* Encryption Engine */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>AES-256 Engine</span>
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
                {telemetry.encryptionSpeedMbSec} MB/s
              </p>
              <span className="text-[10px] text-slate-400 font-mono">Hardware AES-NI</span>
            </div>

            {/* SLA Compliance */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>SLA Compliance</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                {telemetry.slaCompliancePercent}%
              </p>
              <span className="text-[10px] text-slate-400 font-mono">Regulatory Target 95%</span>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Digitized Records</span>
            <HardDrive className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            {totalDocs.toLocaleString()}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
            <span>{totalPages} scanned pages</span>
            <span aria-hidden="true">·</span>
            <span>{(totalBytes / 1000000).toFixed(1)} MB archived</span>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Paper Sheets Saved</span>
            <TreeDeciduous className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-2">
            {estimatedPaperSheetsSaved}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            -84% physical clutter reduction across clinics
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Pending Review Queue</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-2">
            {pendingDocs.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Avg supervisor review: 4.2 hours
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>E2EE Sealed Files</span>
            <Lock className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            100%
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            AES-GCM-256 with SHA-256 chain of custody
          </p>
        </div>
      </div>

      {/* Real-Time Throughput & Personalized Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {showThroughputChart && (
          <div className="lg:col-span-7 p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Data Throughput &amp; Ingestion Stream
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time monitoring of document scans and encryption bandwidth
                  </p>
                </div>

                {/* Personalized Visualization Options */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg shrink-0">
                  <button
                    onClick={() => setChartStyle('line')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-colors ${
                      chartStyle === 'line'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    <LineChart className="w-3.5 h-3.5" />
                    <span>Flow</span>
                  </button>
                  <button
                    onClick={() => setChartStyle('bar')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-colors ${
                      chartStyle === 'bar'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Volume</span>
                  </button>
                </div>
              </div>

              {/* Chart Visualization */}
              {chartStyle === 'line' ? (
                /* Interactive Line / Flow SVG */
                <div className="h-44 w-full flex flex-col justify-end pt-4 border-b border-slate-100 dark:border-slate-800 relative">
                  <div className="absolute top-2 right-2 flex items-center gap-3 text-[11px] font-mono">
                    <span className="flex items-center gap-1 text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Throughput ({telemetry.throughputReqSec} req/s)
                    </span>
                    <span className="flex items-center gap-1 text-sky-600">
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                      Latency ({telemetry.dbLatencyMs} ms)
                    </span>
                  </div>

                  <svg className="w-full h-32 overflow-visible" viewBox="0 0 500 120">
                    {/* Grid lines */}
                    <line x1="0" y1="30" x2="500" y2="30" stroke="currentColor" strokeOpacity="0.08" />
                    <line x1="0" y1="70" x2="500" y2="70" stroke="currentColor" strokeOpacity="0.08" />
                    <line x1="0" y1="110" x2="500" y2="110" stroke="currentColor" strokeOpacity="0.08" />

                    {/* Gradient fill */}
                    <defs>
                      <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Throughput Area */}
                    <path
                      d={`M 0,${120 - (liveThroughputPoints[0].reqs / maxReqs) * 100} 
                          L 100,${120 - (liveThroughputPoints[1].reqs / maxReqs) * 100} 
                          L 200,${120 - (liveThroughputPoints[2].reqs / maxReqs) * 100} 
                          L 300,${120 - (liveThroughputPoints[3].reqs / maxReqs) * 100} 
                          L 400,${120 - (liveThroughputPoints[4].reqs / maxReqs) * 100} 
                          L 500,${120 - (liveThroughputPoints[5].reqs / maxReqs) * 100} 
                          L 500,120 L 0,120 Z`}
                      fill="url(#flowGrad)"
                    />

                    {/* Throughput Line */}
                    <path
                      d={`M 0,${120 - (liveThroughputPoints[0].reqs / maxReqs) * 100} 
                          L 100,${120 - (liveThroughputPoints[1].reqs / maxReqs) * 100} 
                          L 200,${120 - (liveThroughputPoints[2].reqs / maxReqs) * 100} 
                          L 300,${120 - (liveThroughputPoints[3].reqs / maxReqs) * 100} 
                          L 400,${120 - (liveThroughputPoints[4].reqs / maxReqs) * 100} 
                          L 500,${120 - (liveThroughputPoints[5].reqs / maxReqs) * 100}`}
                      fill="none"
                      stroke="#059669"
                      strokeWidth="2.5"
                    />

                    {/* Data Points */}
                    {liveThroughputPoints.map((pt, i) => {
                      const cx = i * 100;
                      const cy = 120 - (pt.reqs / maxReqs) * 100;
                      return (
                        <circle
                          key={i}
                          cx={cx}
                          cy={cy}
                          r="4"
                          className="fill-emerald-600 stroke-white dark:stroke-slate-900 stroke-2"
                        />
                      );
                    })}
                  </svg>

                  <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1">
                    {liveThroughputPoints.map((p, i) => (
                      <span key={i}>{p.time}</span>
                    ))}
                  </div>
                </div>
              ) : (
                /* Bar Volume Chart */
                <div className="h-44 w-full flex items-end justify-between gap-3 pt-4 border-b border-slate-100 dark:border-slate-800">
                  {liveThroughputPoints.map((item, idx) => {
                    const heightPercent = Math.round((item.reqs / maxReqs) * 100);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                        <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.reqs}
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-md relative flex items-end justify-center h-28">
                          <div
                            className="w-full bg-emerald-600 dark:bg-emerald-500 rounded-t-md transition-all duration-300 group-hover:bg-emerald-700"
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          {item.time}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3">
              <span>Provincial Hubs Connected: Gweru, Mutare, Chitungwiza, Harare, Bulawayo</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                Network Latency: {telemetry.dbLatencyMs}ms (Nominal)
              </span>
            </div>
          </div>
        )}

        {/* Right Column: Upcoming Deadlines & Department Breakdown */}
        <div className={`lg:col-span-5 space-y-6 ${!showThroughputChart ? 'lg:col-span-12' : ''}`}>
          {/* Upcoming Deadlines Widget */}
          {showDeadlines && (
            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-rose-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Regulatory Deadlines &amp; SLA Compliance
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-semibold text-rose-600">
                  {upcomingDeadlines.length} Due Soon
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-2">
                {upcomingDeadlines.map((dl) => (
                  <div key={dl.id} className="pt-2 first:pt-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                        {dl.docRef}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                        Expires in {dl.hoursLeft}h
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5 line-clamp-1">
                      {dl.title}
                    </p>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                      <span>{dl.department}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const target = documents.find((d) => d.id === dl.targetDocId);
                          if (target) onSelectDocument(target);
                        }}
                        className="text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5 font-semibold"
                      >
                        Action Dossier <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Department Breakdown */}
          {showCategoryBreakdown && (
            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Records by Department
              </h3>
              <div className="space-y-2.5">
                {Object.entries(categoryCounts).map(([cat, count]) => {
                  const pct = Math.round((count / totalDocs) * 100);
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[220px]">
                          {cat}
                        </span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pending Triage Queue (Direct Action for Supervisors & IT) */}
      {showPendingQueue && pendingDocs.length > 0 && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Pending Document Review Queue ({pendingDocs.length})
              </h3>
            </div>
            <button
              onClick={() => onSelectTab('documents')}
              className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
            >
              View All Records →
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pendingDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 p-2 rounded-lg cursor-pointer transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 dark:text-emerald-400">
                    <span>{doc.referenceNo}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 font-sans">{doc.category}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                    {doc.title}
                  </h4>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    Awaiting Review
                  </span>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 rounded-md hover:bg-emerald-100"
                  >
                    Triage &amp; Sign
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
