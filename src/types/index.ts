export type Role = 'ADMINISTRATOR' | 'HELP_DESK_STAFF' | 'READ_ONLY_VIEWER' | 'MEDICAL_OFFICER';

export type ConfidentialityLevel = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED_MEDICAL';

export type DocumentStatus = 'PENDING_REVIEW' | 'APPROVED' | 'NEEDS_REVISION' | 'ARCHIVED';

export type Department =
  | 'IT Help Desk & Infrastructure'
  | 'Reproductive, Maternal & Child Health'
  | 'Epidemiology & Disease Control'
  | 'Pharmacy & Logistics (NatPharm)'
  | 'Clinical Guidelines & Standards'
  | 'Finance & Health Procurement'
  | 'Personnel & Administration';

export type Permission =
  | 'DOC_SCAN_INGEST'
  | 'DOC_VIEW_PUBLIC'
  | 'DOC_VIEW_INTERNAL'
  | 'DOC_VIEW_CONFIDENTIAL'
  | 'DOC_VIEW_RESTRICTED_MEDICAL'
  | 'DOC_DECRYPT_PAYLOAD'
  | 'DOC_APPROVE_REVIEW'
  | 'DOC_REQUEST_REVISION'
  | 'DOC_ARCHIVE'
  | 'DOC_EXPORT_DATA'
  | 'AUDIT_VIEW_TRAIL'
  | 'AUDIT_VERIFY_CHAIN'
  | 'AUDIT_EXPORT_LOGS'
  | 'RBAC_VIEW_PERMISSIONS'
  | 'RBAC_MODIFY_ROLES'
  | 'SYSTEM_MONITOR_METRICS'
  | 'API_MANAGE_KEYS';

export interface RoleDefinition {
  id: Role;
  name: string;
  description: string;
  badgeColor: string;
  defaultPermissions: Permission[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: Department;
  badgeId: string;
  clearance: ConfidentialityLevel;
  mfaEnabled: boolean;
  biometricActive: boolean;
  customPermissions?: Permission[];
}

export interface ReviewRecord {
  reviewerId: string;
  reviewerName: string;
  reviewerRole: Role;
  action: 'SUBMITTED' | 'APPROVED' | 'REVISION_REQUESTED' | 'ARCHIVED';
  comment: string;
  timestamp: string;
}

export interface EncryptionMetadata {
  algorithm: 'AES-GCM-256';
  iv: string; // Base64
  keyFingerprint: string;
  encryptedSnippet: string; // Base64
  sha256Hash: string;
  cipherLengthBytes: number;
}

export interface HealthDocument {
  id: string;
  referenceNo: string; // e.g. MOHCC-REC-2026-0042
  title: string;
  category: Department;
  confidentiality: ConfidentialityLevel;
  status: DocumentStatus;
  dateCreated: string; // ISO string
  lastModified: string; // ISO string
  dueDate?: string; // Regulatory deadline ISO string
  authorName: string;
  authorDepartment: string;
  fileSize: number; // in bytes
  pageCount: number;
  scanQuality: number; // Percentage, e.g. 98
  summary: string;
  ocrText: string;
  extractedEntities: { label: string; value: string }[];
  tags: string[];
  encryption: EncryptionMetadata;
  reviewHistory: ReviewRecord[];
  helpDeskTicketId?: string;
  sampleScanType?: 'clinic_card' | 'it_ticket' | 'vaccine_log' | 'procurement' | 'surveillance';
}

export type AuditAction =
  | 'SCAN_INGEST'
  | 'VIEW_DOCUMENT'
  | 'DECRYPT_RECORD'
  | 'EXPORT_REPORT_CSV'
  | 'EXPORT_REPORT_PDF'
  | 'UPDATE_STATUS'
  | 'APPROVE_DOCUMENT'
  | 'REQUEST_REVISION'
  | 'ARCHIVE_DOCUMENT'
  | 'MFA_CHALLENGE'
  | 'BIOMETRIC_VERIFIED'
  | 'KEY_ROTATION'
  | 'API_KEY_GENERATED'
  | 'RBAC_PERMISSION_UPDATED'
  | 'UNAUTHORIZED_ACCESS_BLOCKED';

export type AuditSeverity = 'INFO' | 'NOTICE' | 'WARNING' | 'CRITICAL';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: AuditAction;
  documentId?: string;
  documentRef?: string;
  documentTitle?: string;
  details: string;
  ipAddress: string;
  severity: AuditSeverity;
  blockHash: string; // SHA-256 hash of this entry chained to prior entry
  verified?: boolean;
}

export type NotificationType =
  | 'REVIEW_PENDING'
  | 'UPCOMING_DEADLINE'
  | 'SYSTEM_UPDATE'
  | 'SECURITY_ALERT';

export interface SystemNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  targetDocId?: string;
  deadlineDate?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ApiToken {
  id: string;
  name: string;
  token: string;
  department: string;
  createdDate: string;
  expiresInDays: number;
  scopes: string[];
  isActive: boolean;
}

export interface SystemTelemetry {
  cpuUsage: number; // Percentage (e.g. 24)
  memoryUsageMb: number; // e.g. 3420
  memoryMaxMb: number; // e.g. 8192
  dbLatencyMs: number; // e.g. 12
  throughputReqSec: number; // e.g. 184
  encryptionSpeedMbSec: number; // e.g. 48.2
  uptimeSeconds: number;
  activeSessions: number;
  slaCompliancePercent: number; // e.g. 96.8
}
