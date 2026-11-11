import React, { useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Copy,
  Check,
  Printer,
  History,
  Key,
  Database,
  ArrowRight,
  Shield,
  Fingerprint,
} from 'lucide-react';
import { HealthDocument, UserProfile, DocumentStatus, Permission, Role } from '../types';
import { checkDocumentAccess, userHasPermission } from '../utils/rbac';

interface DocumentDetailModalProps {
  document: HealthDocument | null;
  onClose: () => void;
  currentUser: UserProfile;
  rolePermissions?: Record<Role, Permission[]>;
  onUpdateStatus: (docId: string, newStatus: DocumentStatus, comment: string) => void;
  onRequestMfaChallenge: (doc: HealthDocument, onVerified: () => void) => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document,
  onClose,
  currentUser,
  rolePermissions,
  onUpdateStatus,
  onRequestMfaChallenge,
}) => {
  if (!document) return null;

  const [activeTab, setActiveTab] = useState<'record' | 'crypto' | 'workflow' | 'entities'>('record');
  const [showEncryptedRaw, setShowEncryptedRaw] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [actionInProgress, setActionInProgress] = useState<DocumentStatus | null>(null);

  // Strict RBAC Enforcement Check
  const accessCheck = checkDocumentAccess(currentUser, document, rolePermissions);
  const isRestricted = !accessCheck.allowed;
  const canApprove = userHasPermission(currentUser, 'DOC_APPROVE_REVIEW', rolePermissions);

  const handleCopyText = () => {
    navigator.clipboard.writeText(document.ocrText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWorkflowSubmit = (status: DocumentStatus) => {
    if (!reviewComment.trim()) {
      alert('Please enter a clinical or administrative audit note.');
      return;
    }
    onUpdateStatus(document.id, status, reviewComment);
    setReviewComment('');
    setActionInProgress(null);
  };

  const handleUnlockRestricted = () => {
    onRequestMfaChallenge(document, () => {
      // Callback after MFA verified
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(2)} MB`;
    return `${(bytes / 1000).toFixed(1)} KB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                <span>{document.referenceNo}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600 dark:text-slate-300 font-sans">{document.category}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500 font-sans">
                  {new Date(document.dateCreated).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {document.title}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                title="Print Document Dossier"
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Meta Ribbon */}
          <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
            <div>
              <span className="text-slate-400">Confidentiality: </span>
              <span
                className={`font-semibold ${
                  document.confidentiality === 'RESTRICTED_MEDICAL'
                    ? 'text-rose-600 dark:text-rose-400'
                    : document.confidentiality === 'CONFIDENTIAL'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {document.confidentiality.replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Review Status: </span>
              <span
                className={`font-semibold ${
                  document.status === 'APPROVED'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : document.status === 'PENDING_REVIEW'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-600'
                }`}
              >
                {document.status.replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Author: </span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{document.authorName}</span>
            </div>
            <div>
              <span className="text-slate-400">Storage: </span>
              <span className="font-mono">{formatFileSize(document.fileSize)} ({document.pageCount} pgs)</span>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('record')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'record'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Clinical &amp; Health Record
          </button>
          <button
            onClick={() => setActiveTab('crypto')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'crypto'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Cryptographic Envelope</span>
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'workflow'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Review Workflow ({document.reviewHistory.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('entities')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'entities'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Extracted Entities ({document.extractedEntities.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* TAB 1: Document OCR Text */}
          {activeTab === 'record' && (
            <div className="space-y-4">
              {/* If user lacks clearance */}
              {isRestricted ? (
                <div className="p-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-center">
                  <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                    Restricted Medical Record - Access Denied (RBAC Policy)
                  </h3>
                  <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
                    {accessCheck.reason ||
                      `Your active role (${currentUser.role.replace('_', ' ')}) lacks permission to decrypt this record.`}
                  </p>
                  <button
                    onClick={handleUnlockRestricted}
                    className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 shadow-xs"
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>Perform Biometric / 2FA Challenge</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Executive Summary */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Executive Summary
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {document.summary}
                    </p>
                  </div>

                  {/* OCR Transcribed Text Box */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {showEncryptedRaw ? 'Raw AES-GCM Ciphertext' : 'Transcribed OCR Document Body'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Scan Quality: {document.scanQuality}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowEncryptedRaw(!showEncryptedRaw)}
                          className="text-xs text-emerald-700 dark:text-emerald-400 font-medium hover:underline flex items-center gap-1"
                        >
                          {showEncryptedRaw ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          <span>{showEncryptedRaw ? 'Show Decrypted Text' : 'View Ciphertext Payload'}</span>
                        </button>
                        <button
                          onClick={handleCopyText}
                          className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded"
                          title="Copy Document Text"
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {showEncryptedRaw ? (
                        <div className="text-amber-400 break-all">
                          <p className="text-xs text-slate-400 mb-2">
                            [CIPHERTEXT ENVELOPE: ALGORITHM={document.encryption.algorithm} IV={document.encryption.iv}]
                          </p>
                          {document.encryption.encryptedSnippet}
                          ... (Full payload of {document.encryption.cipherLengthBytes.toLocaleString()} bytes encrypted on storage disk)
                        </div>
                      ) : (
                        document.ocrText
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: Cryptographic Envelope */}
          {activeTab === 'crypto' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-white font-mono space-y-3">
                <div className="flex items-center justify-between text-emerald-400 border-b border-slate-800 pb-2">
                  <span className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>END-TO-END ENCRYPTED RECORD SPECIFICATION</span>
                  </span>
                  <span>FIPS 140-3 COMPLIANT</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Symmetric Algorithm:</span>
                    <span className="text-slate-200 font-semibold">{document.encryption.algorithm}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Key Fingerprint:</span>
                    <span className="text-emerald-400 font-semibold">{document.encryption.keyFingerprint}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Initialization Vector (96-bit IV):</span>
                    <span className="text-slate-300 break-all">{document.encryption.iv}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Encrypted Payload Size:</span>
                    <span className="text-slate-300">{document.encryption.cipherLengthBytes.toLocaleString()} bytes</span>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <span className="text-slate-400 block text-[11px]">Cryptographic Digest (SHA-256):</span>
                  <span className="text-amber-300 break-all select-all">{document.encryption.sha256Hash}</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Chain-of-Custody &amp; Data Privacy Certified</span>
                </p>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  This record is tamper-sealed. Any unauthorized bit modification on the storage medium invalidates the SHA-256 integrity checksum and immediately triggers a security alarm in the IT Help Desk operations console.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Review Workflow */}
          {activeTab === 'workflow' && (
            <div className="space-y-6">
              {/* History Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Review &amp; Clearance History
                </h4>
                <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-4 pl-4">
                  {document.reviewHistory.map((rev, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-white dark:bg-slate-900 border-2 border-emerald-600" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {rev.reviewerName} ({rev.reviewerRole.replace('_', ' ')})
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(rev.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                        <span
                          className={`font-semibold mr-1.5 ${
                            rev.action === 'APPROVED'
                              ? 'text-emerald-600'
                              : rev.action === 'REVISION_REQUESTED'
                              ? 'text-rose-600'
                              : 'text-slate-500'
                          }`}
                        >
                          [{rev.action}]
                        </span>
                        <span>{rev.comment}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Form if user has approval rights */}
              {canApprove ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Add Review Disposition or Approval
                  </h4>
                  <textarea
                    rows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Enter clinical audit comment, verification note, or revision instruction..."
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleWorkflowSubmit('APPROVED')}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve &amp; Certify Record</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWorkflowSubmit('NEEDS_REVISION')}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Request Revisions</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWorkflowSubmit('ARCHIVED')}
                      className="px-3.5 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>Move to Cold Archive</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-500">
                  Your active role ({currentUser.role.replace('_', ' ')}) has read-only clearance and lacks the DOC_APPROVE_REVIEW permission.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Extracted Entities */}
          {activeTab === 'entities' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {document.extractedEntities.map((ent, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800"
                  >
                    <span className="text-[11px] font-mono text-slate-400 block">{ent.label}</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 block">
                      {ent.value}
                    </span>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Metadata Index Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {document.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs font-medium"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
          <span>System Record ID: {document.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-lg font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
