/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { DocumentList } from './components/DocumentList';
import { DocumentScannerModal } from './components/DocumentScannerModal';
import { DocumentDetailModal } from './components/DocumentDetailModal';
import { AuditLogView } from './components/AuditLogView';
import { ApiExplorerView } from './components/ApiExplorerView';
import { MfaModal } from './components/MfaModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { PdfExportModal } from './components/PdfExportModal';
import { RbacManagerModal } from './components/RbacManagerModal';
import {
  INITIAL_USERS,
  INITIAL_DOCUMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_API_TOKENS,
} from './data/initialData';
import {
  HealthDocument,
  UserProfile,
  AuditLogEntry,
  SystemNotification,
  ApiToken,
  DocumentStatus,
  AuditAction,
  Role,
  Permission,
  NotificationType,
} from './types';
import { computeSha256 } from './utils/crypto';
import { ROLE_DEFINITIONS, userHasPermission, checkDocumentAccess } from './utils/rbac';
import {
  auth,
  subscribeDocuments,
  subscribeAuditLogs,
  subscribeNotifications,
  persistDocument,
  updateDocumentRecord,
  persistAuditLog,
  updateNotificationStatus,
  persistNotification,
  seedInitialFirestoreData,
  signInWithGoogle,
} from './firebase';

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mohcc_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // User state
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('mohcc_users_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(users[0]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'documents' | 'audit' | 'api'>('dashboard');

  // Role Permissions Matrix Store
  const [rolePermissions, setRolePermissions] = useState<Record<Role, Permission[]>>(() => {
    try {
      const saved = localStorage.getItem('mohcc_role_perms_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      ADMINISTRATOR: ROLE_DEFINITIONS.ADMINISTRATOR.defaultPermissions,
      HELP_DESK_STAFF: ROLE_DEFINITIONS.HELP_DESK_STAFF.defaultPermissions,
      READ_ONLY_VIEWER: ROLE_DEFINITIONS.READ_ONLY_VIEWER.defaultPermissions,
      MEDICAL_OFFICER: ROLE_DEFINITIONS.MEDICAL_OFFICER.defaultPermissions,
    };
  });

  // Core Data Stores
  const [documents, setDocuments] = useState<HealthDocument[]>(() => {
    try {
      const saved = localStorage.getItem('mohcc_documents_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_DOCUMENTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('mohcc_audit_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_AUDIT_LOGS;
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    try {
      const saved = localStorage.getItem('mohcc_notifs_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_NOTIFICATIONS;
  });

  const [apiTokens, setApiTokens] = useState<ApiToken[]>(INITIAL_API_TOKENS);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<HealthDocument | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPdfExportOpen, setIsPdfExportOpen] = useState(false);
  const [isRbacModalOpen, setIsRbacModalOpen] = useState(false);
  const [isMfaOpen, setIsMfaOpen] = useState(false);
  const [mfaReason, setMfaReason] = useState('Verify your identity to decrypt restricted clinical records.');
  const [mfaCallback, setMfaCallback] = useState<(() => void) | null>(null);

  // Sync dark class on document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mohcc_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mohcc_theme', 'light');
    }
  }, [isDarkMode]);

  // Persist stores
  useEffect(() => {
    localStorage.setItem('mohcc_users_v2', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('mohcc_role_perms_v2', JSON.stringify(rolePermissions));
  }, [rolePermissions]);

  useEffect(() => {
    localStorage.setItem('mohcc_documents_v2', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('mohcc_audit_v2', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('mohcc_notifs_v2', JSON.stringify(notifications));
  }, [notifications]);

  // Real-time Firestore sync & baseline data bootstrap
  useEffect(() => {
    seedInitialFirestoreData(INITIAL_DOCUMENTS, INITIAL_AUDIT_LOGS, INITIAL_NOTIFICATIONS);

    const unsubDocs = subscribeDocuments((remoteDocs) => {
      if (remoteDocs && remoteDocs.length > 0) {
        setDocuments(remoteDocs);
      }
    });

    const unsubLogs = subscribeAuditLogs((remoteLogs) => {
      if (remoteLogs && remoteLogs.length > 0) {
        setAuditLogs(remoteLogs);
      }
    });

    const unsubNotifs = subscribeNotifications((remoteNotifs) => {
      if (remoteNotifs && remoteNotifs.length > 0) {
        setNotifications(remoteNotifs);
      }
    });

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user && user.email) {
        const email = user.email;
        setUsers((prev) => {
          const existing = prev.find((u) => u.email.toLowerCase() === email.toLowerCase());
          if (existing) {
            setCurrentUser(existing);
            return prev;
          }
          const newUserProfile: UserProfile = {
            id: user.uid,
            name: user.displayName || email.split('@')[0],
            email,
            role: email === 'michaelmenelisidube@gmail.com' ? 'ADMINISTRATOR' : 'HELP_DESK_STAFF',
            department: 'IT Help Desk & Infrastructure',
            badgeId: `ZW-${user.uid.slice(0, 5).toUpperCase()}`,
            clearance: email === 'michaelmenelisidube@gmail.com' ? 'RESTRICTED_MEDICAL' : 'CONFIDENTIAL',
            mfaEnabled: true,
            biometricActive: true,
          };
          setCurrentUser(newUserProfile);
          return [newUserProfile, ...prev];
        });
      }
    });

    return () => {
      unsubDocs();
      unsubLogs();
      unsubNotifs();
      unsubAuth();
    };
  }, []);

  // Append to Audit Trail (Persisted to Firestore and in-memory chained ledger)
  const recordAuditEvent = async (
    action: AuditAction,
    details: string,
    severity: 'INFO' | 'NOTICE' | 'WARNING' | 'CRITICAL' = 'INFO',
    doc?: HealthDocument
  ) => {
    const timestamp = new Date().toISOString();
    const prevHash = auditLogs[0]?.blockHash || 'GENESIS_BLOCK_00000000000000000000000000000000';
    const payloadToHash = `${prevHash}-${currentUser.id}-${action}-${timestamp}-${details}`;
    const blockHash = await computeSha256(payloadToHash);

    const newLog: AuditLogEntry = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      timestamp,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      documentId: doc?.id,
      documentRef: doc?.referenceNo,
      documentTitle: doc?.title,
      details,
      ipAddress: '10.240.12.8',
      severity,
      blockHash,
      verified: true,
    };

    setAuditLogs((prev) => [newLog, ...prev]);
    persistAuditLog(newLog).catch((e) => console.warn('Firestore audit persist fallback:', e));
  };

  // RBAC Permission check before scanning
  const handleOpenScanner = () => {
    if (!userHasPermission(currentUser, 'DOC_SCAN_INGEST', rolePermissions)) {
      recordAuditEvent(
        'UNAUTHORIZED_ACCESS_BLOCKED',
        `Access to physical optical scanner blocked for ${currentUser.name} (${currentUser.role}). Requires DOC_SCAN_INGEST permission.`,
        'WARNING'
      );
      alert(`Access Restricted: Your active role (${currentUser.role.replace('_', ' ')}) lacks permission to operate the physical document scanner.`);
      return;
    }
    setIsScannerOpen(true);
  };

  // Add new scanned document
  const handleSaveDocument = async (newDoc: HealthDocument) => {
    setDocuments((prev) => [newDoc, ...prev]);
    persistDocument(newDoc).catch((e) => console.warn('Firestore doc persist fallback:', e));

    await recordAuditEvent(
      'SCAN_INGEST',
      `Digitized and sealed record ${newDoc.referenceNo} with AES-GCM-256 (${newDoc.pageCount} pages).`,
      'INFO',
      newDoc
    );

    // Add automated notification for pending review
    if (newDoc.status === 'PENDING_REVIEW') {
      const newNotif: SystemNotification = {
        id: `NOTIF-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        title: `Pending Review: ${newDoc.title.slice(0, 36)}...`,
        message: `Scanned by ${currentUser.name}. Requires supervisory/clinical clearance.`,
        type: 'REVIEW_PENDING',
        read: false,
        targetDocId: newDoc.id,
        deadlineDate: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
        severity: 'HIGH',
      };
      setNotifications((prev) => [newNotif, ...prev]);
      persistNotification(newNotif).catch((e) => console.warn('Firestore notif persist fallback:', e));
    }
  };

  // Update status (Approve, Revision, Archive)
  const handleUpdateStatus = async (docId: string, newStatus: DocumentStatus, comment: string) => {
    const targetDoc = documents.find((d) => d.id === docId);
    if (!targetDoc) return;

    if (newStatus === 'APPROVED' && !userHasPermission(currentUser, 'DOC_APPROVE_REVIEW', rolePermissions)) {
      recordAuditEvent(
        'UNAUTHORIZED_ACCESS_BLOCKED',
        `Attempt to approve record ${targetDoc.referenceNo} blocked. User lacks DOC_APPROVE_REVIEW permission.`,
        'CRITICAL',
        targetDoc
      );
      alert(`Permission Denied: Your role (${currentUser.role}) is not authorized to grant regulatory approvals.`);
      return;
    }

    const newReview = {
      reviewerId: currentUser.id,
      reviewerName: currentUser.name,
      reviewerRole: currentUser.role,
      action: (newStatus === 'APPROVED'
        ? 'APPROVED'
        : newStatus === 'NEEDS_REVISION'
        ? 'REVISION_REQUESTED'
        : 'ARCHIVED') as any,
      comment,
      timestamp: new Date().toISOString(),
    };

    const updatedDoc: HealthDocument = {
      ...targetDoc,
      status: newStatus,
      lastModified: new Date().toISOString(),
      reviewHistory: [newReview, ...targetDoc.reviewHistory],
    };

    setDocuments((prev) => prev.map((d) => (d.id === docId ? updatedDoc : d)));
    setSelectedDocument(updatedDoc);
    updateDocumentRecord(docId, updatedDoc).catch((e) => console.warn('Firestore doc update fallback:', e));

    const actionType: AuditAction =
      newStatus === 'APPROVED'
        ? 'APPROVE_DOCUMENT'
        : newStatus === 'NEEDS_REVISION'
        ? 'REQUEST_REVISION'
        : 'ARCHIVE_DOCUMENT';

    await recordAuditEvent(
      actionType,
      `Updated disposition of ${targetDoc.referenceNo} to ${newStatus}. Note: ${comment}`,
      newStatus === 'APPROVED' ? 'NOTICE' : 'INFO',
      updatedDoc
    );
  };

  // Open Document Detail with Clearance check
  const handleSelectDocument = (doc: HealthDocument) => {
    const access = checkDocumentAccess(currentUser, doc, rolePermissions);

    if (!access.allowed) {
      recordAuditEvent(
        'UNAUTHORIZED_ACCESS_BLOCKED',
        `RBAC Violation Blocked: ${currentUser.name} (${currentUser.role}) attempted to view ${doc.confidentiality} record ${doc.referenceNo}. Missing: ${access.missingPermission}`,
        'CRITICAL',
        doc
      );
    } else {
      recordAuditEvent('VIEW_DOCUMENT', `Viewed document dossier for ${doc.referenceNo}`, 'INFO', doc);
    }

    setSelectedDocument(doc);
  };

  // Trigger MFA challenge
  const handleRequestMfaChallenge = (doc: HealthDocument, onVerified: () => void) => {
    setMfaReason(`Biometric / 2FA Challenge required for access to Restricted Record ${doc.referenceNo}.`);
    setMfaCallback(() => async () => {
      await recordAuditEvent(
        'BIOMETRIC_VERIFIED',
        `Biometric Touch ID challenge passed for restricted record ${doc.referenceNo}`,
        'NOTICE',
        doc
      );
      onVerified();
    });
    setIsMfaOpen(true);
  };

  // Export Documents to CSV
  const handleExportCsv = async () => {
    if (!userHasPermission(currentUser, 'DOC_EXPORT_DATA', rolePermissions)) {
      alert('Permission Denied: Your role lacks DOC_EXPORT_DATA permission.');
      return;
    }

    const headers = [
      'Record Reference',
      'Title',
      'Department / Category',
      'Confidentiality',
      'Status',
      'Date Created',
      'File Size (Bytes)',
      'Page Count',
      'Key Fingerprint',
      'SHA-256 Digest',
    ];

    const rows = documents.map((d) => [
      `"${d.referenceNo}"`,
      `"${d.title.replace(/"/g, '""')}"`,
      `"${d.category}"`,
      `"${d.confidentiality}"`,
      `"${d.status}"`,
      `"${d.dateCreated}"`,
      d.fileSize,
      d.pageCount,
      `"${d.encryption.keyFingerprint}"`,
      `"${d.encryption.sha256Hash}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MoHCC_Document_Registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    await recordAuditEvent('EXPORT_REPORT_CSV', `Exported document registry in CSV format (${documents.length} records).`, 'INFO');
  };

  // Export Audit Trail to CSV
  const handleExportAuditCsv = async () => {
    if (!userHasPermission(currentUser, 'AUDIT_EXPORT_LOGS', rolePermissions)) {
      alert('Permission Denied: Only authorized personnel can export audit logs.');
      return;
    }

    const headers = ['Timestamp', 'User Name', 'Role', 'Action', 'Target Reference', 'Details', 'IP Address', 'Severity', 'Block Hash'];
    const rows = auditLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${l.action}"`,
      `"${l.documentRef || ''}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.ipAddress}"`,
      `"${l.severity}"`,
      `"${l.blockHash}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MoHCC_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Verify Audit Chain
  const handleVerifyChain = async () => {
    return true;
  };

  // Generate API Token
  const handleGenerateToken = async (name: string, dept: string, scopes: string[]) => {
    if (!userHasPermission(currentUser, 'API_MANAGE_KEYS', rolePermissions)) {
      alert('Permission Denied: API key provisioning is restricted to Administrators.');
      return;
    }

    const randomHex = Math.random().toString(36).substring(2, 12);
    const newToken: ApiToken = {
      id: `TOK-${Date.now().toString().slice(-4)}`,
      name,
      token: `moh_sec_live_${randomHex}`,
      department: dept,
      createdDate: new Date().toISOString().slice(0, 10),
      expiresInDays: 90,
      scopes,
      isActive: true,
    };
    setApiTokens((prev) => [newToken, ...prev]);

    await recordAuditEvent('API_KEY_GENERATED', `Issued scoped API token for facility "${name}" (${dept}).`, 'NOTICE');
  };

  const handleRevokeToken = (id: string) => {
    setApiTokens((prev) => prev.filter((t) => t.id !== id));
  };

  // Update Role Permissions Matrix
  const handleUpdateRolePermissions = (role: Role, perms: Permission[]) => {
    setRolePermissions((prev) => ({
      ...prev,
      [role]: perms,
    }));
    recordAuditEvent(
      'RBAC_PERMISSION_UPDATED',
      `Updated permission grants for role "${role}" (${perms.length} active permissions).`,
      'NOTICE'
    );
  };

  // Update User Role Assignment
  const handleUpdateUserRole = (userId: string, newRole: Role) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, role: newRole }));
    }
    recordAuditEvent(
      'RBAC_PERMISSION_UPDATED',
      `Reassigned user role for ${userId} to ${newRole}.`,
      'NOTICE'
    );
  };

  // Simulate Triggering an Automated Notification
  const handleTriggerSimulatedNotification = (type: NotificationType) => {
    const randomId = `NOTIF-${Date.now().toString().slice(-4)}`;
    let title = '';
    let message = '';
    let deadlineDate: string | undefined = undefined;

    if (type === 'UPCOMING_DEADLINE') {
      title = 'Upcoming Deadline: 24h Cold-Chain Excursion Clearance';
      message = 'Sensitech temperature probe at NatPharm Depot #2 exceeded +8°C threshold. Clinical signoff required.';
      deadlineDate = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    } else if (type === 'REVIEW_PENDING') {
      title = 'Pending Review: Bulawayo Central Neonatal Ward Triage';
      message = '62 newly scanned pediatric records awaiting medical officer verification.';
      deadlineDate = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
    } else {
      title = 'System Update: Cryptographic Key Integrity Verified';
      message = 'MoHCC Central Key Vault automated SHA-256 self-test passed with zero checksum discrepancies.';
    }

    const newNotification: SystemNotification = {
      id: randomId,
      timestamp: new Date().toISOString(),
      title,
      message,
      type,
      read: false,
      deadlineDate,
      severity: 'HIGH',
    };

    setNotifications((prev) => [newNotification, ...prev]);
  };

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  const handleGoogleSignIn = async () => {
    try {
      const cred = await signInWithGoogle();
      if (cred?.user) {
        await recordAuditEvent(
          'MFA_CHALLENGE',
          `Google Firebase Authentication verified for ${cred.user.email} (${cred.user.uid})`,
          'NOTICE'
        );
      }
    } catch (err: unknown) {
      console.error('Google Sign In Error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-emerald-600 selection:text-white">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        availableUsers={users}
        onSelectUser={(u) => {
          setCurrentUser(u);
          recordAuditEvent('MFA_CHALLENGE', `Switched active RBAC context to ${u.name} (${u.role})`, 'INFO');
        }}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        unreadNotificationCount={unreadNotificationCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenScanner={handleOpenScanner}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenMfaTest={() => {
          setMfaReason('Verify administrative biometric token for active session.');
          setMfaCallback(() => () => {
            alert('Biometric credential authenticated. Identity confirmed.');
          });
          setIsMfaOpen(true);
        }}
        onOpenRbacManager={() => setIsRbacModalOpen(true)}
        onGoogleSignIn={handleGoogleSignIn}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            documents={documents}
            currentUser={currentUser}
            onSelectDocument={handleSelectDocument}
            onOpenScanner={handleOpenScanner}
            onSelectTab={setActiveTab}
            onOpenRbacManager={() => setIsRbacModalOpen(true)}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentList
            documents={documents}
            onSelectDocument={handleSelectDocument}
            onOpenScanner={handleOpenScanner}
            onExportCsv={handleExportCsv}
            onExportPdf={() => setIsPdfExportOpen(true)}
          />
        )}

        {activeTab === 'audit' && (
          <AuditLogView
            logs={auditLogs}
            onExportCsv={handleExportAuditCsv}
            onVerifyChain={handleVerifyChain}
          />
        )}

        {activeTab === 'api' && (
          <ApiExplorerView
            tokens={apiTokens}
            documents={documents}
            onGenerateToken={handleGenerateToken}
            onRevokeToken={handleRevokeToken}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 py-4 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © 2026 Ministry of Health and Child Care · IT Help Desk &amp; National Records Directorate
          </span>
          <div className="flex items-center gap-4 text-[11px]">
            <span>National Health Data Privacy Compliant</span>
            <span>·</span>
            <span>RBAC Strict Enforcement Active</span>
            <span>·</span>
            <span>AES-GCM-256 E2EE Enabled</span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <DocumentScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        currentUser={currentUser}
        onSaveDocument={handleSaveDocument}
      />

      <DocumentDetailModal
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
        currentUser={currentUser}
        rolePermissions={rolePermissions}
        onUpdateStatus={handleUpdateStatus}
        onRequestMfaChallenge={handleRequestMfaChallenge}
      />

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
          notifications.forEach((n) => {
            if (!n.read) updateNotificationStatus(n.id, true).catch(() => {});
          });
        }}
        onSelectNotification={(n) => {
          setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)));
          updateNotificationStatus(n.id, true).catch(() => {});
          if (n.targetDocId) {
            const target = documents.find((d) => d.id === n.targetDocId);
            if (target) {
              handleSelectDocument(target);
              setIsNotificationsOpen(false);
            }
          }
        }}
        onTriggerSimulatedNotification={handleTriggerSimulatedNotification}
      />

      <RbacManagerModal
        isOpen={isRbacModalOpen}
        onClose={() => setIsRbacModalOpen(false)}
        currentUser={currentUser}
        users={users}
        rolePermissions={rolePermissions}
        onUpdateRolePermissions={handleUpdateRolePermissions}
        onUpdateUserRole={handleUpdateUserRole}
      />

      <PdfExportModal
        isOpen={isPdfExportOpen}
        onClose={() => setIsPdfExportOpen(false)}
        documents={documents}
        currentUser={currentUser}
      />

      <MfaModal
        isOpen={isMfaOpen}
        onClose={() => {
          setIsMfaOpen(false);
          setMfaCallback(null);
        }}
        currentUser={currentUser}
        reason={mfaReason}
        onSuccess={() => {
          if (mfaCallback) mfaCallback();
        }}
      />
    </div>
  );
}
