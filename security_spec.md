# MoHCC File Management System — Firestore Security Specification

## 1. Data Invariants
1. **Default Deny**: Any path not explicitly matched is strictly inaccessible.
2. **Identity Integrity**: User profile document `/users/{userId}` can only be written by the authenticated user matching `userId` or an administrator; role escalation must be blocked.
3. **Immutable Audit Trail**: `/auditLogs/{logId}` entries can ONLY be created; updates and deletions are mathematically forbidden to guarantee an unalterable forensic record.
4. **Document Access Governance**:
   - `RESTRICTED_MEDICAL` records require proper clearance and authenticated session.
   - Updates to documents must enforce valid schemas and cannot corrupt `id`, `referenceNo`, or `dateCreated`.
5. **System Notifications**: Users can read notifications and mark their own notifications as read (`read: true`), but cannot delete global system broadcast alerts.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Read on Restricted Document**: Attempt to read `/documents/DOC-001` without an auth token. (Must return `PERMISSION_DENIED`).
2. **Audit Log Tampering / Overwrite**: Attempt to update `/auditLogs/LOG-001` to alter `sha256Digest` or delete an access event. (Must return `PERMISSION_DENIED`).
3. **Audit Log Deletion**: Attempt to delete `/auditLogs/LOG-001` to erase an access trail. (Must return `PERMISSION_DENIED`).
4. **Role Self-Escalation**: Standard user attempting to write `role: "ADMINISTRATOR"` or `clearance: "RESTRICTED_MEDICAL"` to their `/users/{userId}` doc. (Must return `PERMISSION_DENIED`).
5. **Shadow Field Injection**: Attempt to create `/documents/DOC-002` with an unauthorized ghost field `__backdoor_owner: true`. (Must return `PERMISSION_DENIED`).
6. **Path Traversal / ID Poisoning**: Attempt to write with a 2KB junk character document ID `DOC-...`. (Must return `PERMISSION_DENIED`).
7. **Cross-Tenant Impersonation**: User A attempting to create a document with `authorId: "user_b"`. (Must return `PERMISSION_DENIED`).
8. **Negative / Invalid Scan Quality**: Attempt to write a document with `scanQuality: 9999` or negative size. (Must return `PERMISSION_DENIED`).
9. **Tampering with Immutable Creation Date**: Updating an existing document to falsify `dateCreated`. (Must return `PERMISSION_DENIED`).
10. **Corrupted Hash Digest**: Submitting an audit log without a valid 64-character SHA-256 digest string. (Must return `PERMISSION_DENIED`).
11. **Malicious Notification Injection**: Non-admin attempting to create a broadcast notification targeting all medical officers. (Must return `PERMISSION_DENIED`).
12. **Blanket Collection Scraping**: Querying documents without appropriate department/clearance filters. (Must return `PERMISSION_DENIED`).
