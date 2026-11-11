import { Role, Permission, RoleDefinition, UserProfile, HealthDocument } from '../types';

export const ROLE_DEFINITIONS: Record<Role, RoleDefinition> = {
  ADMINISTRATOR: {
    id: 'ADMINISTRATOR',
    name: 'Administrator',
    description: 'Full supervisory authority over MoHCC IT infrastructure, encryption keys, RBAC governance, and unconstrained audit logging.',
    badgeColor: 'text-purple-700 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-300',
    defaultPermissions: [
      'DOC_SCAN_INGEST',
      'DOC_VIEW_PUBLIC',
      'DOC_VIEW_INTERNAL',
      'DOC_VIEW_CONFIDENTIAL',
      'DOC_VIEW_RESTRICTED_MEDICAL',
      'DOC_DECRYPT_PAYLOAD',
      'DOC_APPROVE_REVIEW',
      'DOC_REQUEST_REVISION',
      'DOC_ARCHIVE',
      'DOC_EXPORT_DATA',
      'AUDIT_VIEW_TRAIL',
      'AUDIT_VERIFY_CHAIN',
      'AUDIT_EXPORT_LOGS',
      'RBAC_VIEW_PERMISSIONS',
      'RBAC_MODIFY_ROLES',
      'SYSTEM_MONITOR_METRICS',
      'API_MANAGE_KEYS',
    ],
  },
  HELP_DESK_STAFF: {
    id: 'HELP_DESK_STAFF',
    name: 'Help Desk Staff',
    description: 'Operational IT and records personnel responsible for high-speed scanning, OCR ingestion, physical triage, and operational records.',
    badgeColor: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300',
    defaultPermissions: [
      'DOC_SCAN_INGEST',
      'DOC_VIEW_PUBLIC',
      'DOC_VIEW_INTERNAL',
      'DOC_VIEW_CONFIDENTIAL',
      'DOC_DECRYPT_PAYLOAD',
      'DOC_REQUEST_REVISION',
      'DOC_EXPORT_DATA',
      'AUDIT_VIEW_TRAIL',
      'SYSTEM_MONITOR_METRICS',
    ],
  },
  READ_ONLY_VIEWER: {
    id: 'READ_ONLY_VIEWER',
    name: 'Read-Only Viewer',
    description: 'External observers, general administrative staff, and auditors with read-only view access to public/internal health directives.',
    badgeColor: 'text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300',
    defaultPermissions: [
      'DOC_VIEW_PUBLIC',
      'DOC_VIEW_INTERNAL',
      'AUDIT_VIEW_TRAIL',
      'AUDIT_VERIFY_CHAIN',
    ],
  },
  MEDICAL_OFFICER: {
    id: 'MEDICAL_OFFICER',
    name: 'Medical Officer',
    description: 'Licensed clinical practitioners authorized to review, decrypt, and sign off on sensitive pediatric, maternal, and patient health files.',
    badgeColor: 'text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300',
    defaultPermissions: [
      'DOC_VIEW_PUBLIC',
      'DOC_VIEW_INTERNAL',
      'DOC_VIEW_CONFIDENTIAL',
      'DOC_VIEW_RESTRICTED_MEDICAL',
      'DOC_DECRYPT_PAYLOAD',
      'DOC_APPROVE_REVIEW',
      'DOC_REQUEST_REVISION',
      'DOC_EXPORT_DATA',
      'AUDIT_VIEW_TRAIL',
    ],
  },
};

export const PERMISSION_METADATA: Record<
  Permission,
  { label: string; category: 'Documents' | 'Security & RBAC' | 'Audit & Monitoring'; description: string }
> = {
  DOC_SCAN_INGEST: {
    label: 'Scan & Ingest Documents',
    category: 'Documents',
    description: 'Access optical camera scanner and upload files to the encrypted cloud vault.',
  },
  DOC_VIEW_PUBLIC: {
    label: 'View Public Records',
    category: 'Documents',
    description: 'Read open epidemiological reports and Ministry circulars.',
  },
  DOC_VIEW_INTERNAL: {
    label: 'View Internal Records',
    category: 'Documents',
    description: 'Read internal IT tickets, maintenance logs, and standard operating procedures.',
  },
  DOC_VIEW_CONFIDENTIAL: {
    label: 'View Confidential Records',
    category: 'Documents',
    description: 'Access procurement tenders, hospital infrastructure audits, and drug supply consignments.',
  },
  DOC_VIEW_RESTRICTED_MEDICAL: {
    label: 'Access Restricted Medical Records',
    category: 'Documents',
    description: 'Access highly sensitive patient health identifiers, pediatric growth cards, and maternal mortality audits.',
  },
  DOC_DECRYPT_PAYLOAD: {
    label: 'Decrypt AES-256 Payloads',
    category: 'Documents',
    description: 'Trigger client-side AES-GCM-256 decryption keys for stored records.',
  },
  DOC_APPROVE_REVIEW: {
    label: 'Approve & Certify Records',
    category: 'Documents',
    description: 'Grant formal regulatory approval and digital signoff on pending records.',
  },
  DOC_REQUEST_REVISION: {
    label: 'Request Document Revisions',
    category: 'Documents',
    description: 'Return submitted documents to field officers for correction or missing metadata.',
  },
  DOC_ARCHIVE: {
    label: 'Cold Archive Documents',
    category: 'Documents',
    description: 'Move active records to permanent statutory cold storage.',
  },
  DOC_EXPORT_DATA: {
    label: 'Export Document Reports',
    category: 'Documents',
    description: 'Generate and download official CSV registries and PDF certificates.',
  },
  AUDIT_VIEW_TRAIL: {
    label: 'View Audit Logs',
    category: 'Audit & Monitoring',
    description: 'Inspect chronological system activity and file access records.',
  },
  AUDIT_VERIFY_CHAIN: {
    label: 'Verify Cryptographic Audit Chain',
    category: 'Audit & Monitoring',
    description: 'Execute SHA-256 block hash integrity verification across all log events.',
  },
  AUDIT_EXPORT_LOGS: {
    label: 'Export Audit Trail',
    category: 'Audit & Monitoring',
    description: 'Download full tamper-evident audit logs in CSV format.',
  },
  RBAC_VIEW_PERMISSIONS: {
    label: 'View RBAC Permissions Matrix',
    category: 'Security & RBAC',
    description: 'Inspect assigned role permissions and active user access levels.',
  },
  RBAC_MODIFY_ROLES: {
    label: 'Modify RBAC Roles & Grants',
    category: 'Security & RBAC',
    description: 'Reassign user roles and configure granular permission overrides.',
  },
  SYSTEM_MONITOR_METRICS: {
    label: 'Monitor Real-Time System Metrics',
    category: 'Audit & Monitoring',
    description: 'Inspect CPU load, throughput, memory utilization, and hardware telemetry.',
  },
  API_MANAGE_KEYS: {
    label: 'Manage Developer API Tokens',
    category: 'Security & RBAC',
    description: 'Generate, scope, and revoke hospital EHR integration API keys.',
  },
};

/**
 * Checks if a user has a specific permission (considering role defaults + custom overrides)
 */
export function userHasPermission(
  user: UserProfile,
  permission: Permission,
  rolePermissionsMap: Record<Role, Permission[]> = {
    ADMINISTRATOR: ROLE_DEFINITIONS.ADMINISTRATOR.defaultPermissions,
    HELP_DESK_STAFF: ROLE_DEFINITIONS.HELP_DESK_STAFF.defaultPermissions,
    READ_ONLY_VIEWER: ROLE_DEFINITIONS.READ_ONLY_VIEWER.defaultPermissions,
    MEDICAL_OFFICER: ROLE_DEFINITIONS.MEDICAL_OFFICER.defaultPermissions,
  }
): boolean {
  if (user.role === 'ADMINISTRATOR') return true;

  // Custom user overrides take precedence if defined
  if (user.customPermissions && user.customPermissions.includes(permission)) {
    return true;
  }

  const rolePerms = rolePermissionsMap[user.role] || ROLE_DEFINITIONS[user.role]?.defaultPermissions || [];
  return rolePerms.includes(permission);
}

/**
 * Strict Document Access Enforcement Check
 */
export function checkDocumentAccess(
  user: UserProfile,
  doc: HealthDocument,
  rolePermissionsMap?: Record<Role, Permission[]>
): {
  allowed: boolean;
  reason?: string;
  requiredClearance?: string;
  missingPermission?: Permission;
} {
  // Administrators have full clearance
  if (user.role === 'ADMINISTRATOR') {
    return { allowed: true };
  }

  // 1. Check Confidentiality Level against Permissions
  if (doc.confidentiality === 'PUBLIC') {
    if (!userHasPermission(user, 'DOC_VIEW_PUBLIC', rolePermissionsMap)) {
      return {
        allowed: false,
        reason: 'Your account lacks the DOC_VIEW_PUBLIC permission.',
        missingPermission: 'DOC_VIEW_PUBLIC',
      };
    }
    return { allowed: true };
  }

  if (doc.confidentiality === 'INTERNAL') {
    if (!userHasPermission(user, 'DOC_VIEW_INTERNAL', rolePermissionsMap)) {
      return {
        allowed: false,
        reason: 'Your account lacks the DOC_VIEW_INTERNAL permission.',
        missingPermission: 'DOC_VIEW_INTERNAL',
      };
    }
    return { allowed: true };
  }

  if (doc.confidentiality === 'CONFIDENTIAL') {
    if (!userHasPermission(user, 'DOC_VIEW_CONFIDENTIAL', rolePermissionsMap)) {
      return {
        allowed: false,
        reason: 'Access Restricted: CONFIDENTIAL records require Help Desk Staff, Medical Officer, or Administrator clearance.',
        requiredClearance: 'CONFIDENTIAL',
        missingPermission: 'DOC_VIEW_CONFIDENTIAL',
      };
    }
    return { allowed: true };
  }

  if (doc.confidentiality === 'RESTRICTED_MEDICAL') {
    if (!userHasPermission(user, 'DOC_VIEW_RESTRICTED_MEDICAL', rolePermissionsMap)) {
      return {
        allowed: false,
        reason: 'Access Denied: RESTRICTED_MEDICAL records contain protected child & patient health information and are strictly restricted to licensed Medical Officers and System Administrators.',
        requiredClearance: 'RESTRICTED_MEDICAL',
        missingPermission: 'DOC_VIEW_RESTRICTED_MEDICAL',
      };
    }
    return { allowed: true };
  }

  return { allowed: true };
}
