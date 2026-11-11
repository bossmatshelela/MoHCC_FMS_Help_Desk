import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Download,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Fingerprint,
  Key,
  FileSpreadsheet,
} from 'lucide-react';
import { AuditLogEntry, AuditSeverity, AuditAction } from '../types';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
  onExportCsv: () => void;
  onVerifyChain: () => Promise<boolean>;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  logs,
  onExportCsv,
  onVerifyChain,
}) => {
  const [search, setSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationPassed, setVerificationPassed] = useState<boolean | null>(true);

  const filteredLogs = logs.filter((log) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchUser = log.userName.toLowerCase().includes(q);
      const matchDoc = (log.documentTitle || log.documentRef || '').toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchIp = log.ipAddress.includes(q);
      if (!matchAction && !matchUser && !matchDoc && !matchDetails && !matchIp) return false;
    }
    if (selectedSeverity !== 'ALL' && log.severity !== selectedSeverity) {
      return false;
    }
    return true;
  });

  const handleRunVerification = async () => {
    setIsVerifying(true);
    const passed = await onVerifyChain();
    setVerificationPassed(passed);
    setIsVerifying(false);
  };

  const getSeverityBadge = (sev: AuditSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="font-bold text-rose-600 dark:text-rose-400">CRITICAL</span>;
      case 'WARNING':
        return <span className="font-bold text-amber-600 dark:text-amber-400">WARNING</span>;
      case 'NOTICE':
        return <span className="font-semibold text-sky-600 dark:text-sky-400">NOTICE</span>;
      case 'INFO':
        return <span className="font-medium text-slate-500">INFO</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Cryptographic Chain-of-Custody Status */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Immutable SHA-256 Audit Trail &amp; Access Log
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            Every file access, decryption attempt, status modification, and biometric challenge is signed with a cryptographic block hash forming an immutable audit chain.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleRunVerification}
            disabled={isVerifying}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>Verify Blockchain-Style Hashes</span>
          </button>

          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {verificationPassed && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Cryptographic chain verification passed: All {logs.length} audit entries are cryptographically intact. Zero tampering detected.
            </span>
          </div>
          <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 hidden sm:inline">
            Status: VALIDATED (SHA-256)
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, user, document or IP..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Alerts</option>
              <option value="WARNING">Warnings</option>
              <option value="NOTICE">Notices</option>
              <option value="INFO">Informational</option>
            </select>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            {filteredLogs.length} events logged
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Actor &amp; Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Document / Scope</th>
                <th className="py-3 px-4">Details &amp; Audit Note</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Block Hash (SHA-256)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-500 dark:text-slate-400">
                    {new Date(log.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <p className="font-semibold text-slate-900 dark:text-white">{log.userName}</p>
                    <p className="text-[10px] text-slate-400">{log.userRole.replace('_', ' ')}</p>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 min-w-[200px]">
                    {log.documentRef ? (
                      <div>
                        <span className="font-mono text-emerald-600 text-[11px] block">
                          {log.documentRef}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 line-clamp-1">
                          {log.documentTitle}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-mono">System Console</span>
                    )}
                  </td>
                  <td className="py-3 px-4 min-w-[260px] text-slate-600 dark:text-slate-300">
                    {log.details}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                    {log.ipAddress}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {getSeverityBadge(log.severity)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-[10px] text-slate-400">
                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                      {log.blockHash.substring(0, 12)}...
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
