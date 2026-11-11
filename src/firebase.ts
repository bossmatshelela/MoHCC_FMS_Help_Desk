import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { HealthDocument, AuditLogEntry, SystemNotification } from './types';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with custom database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error Handling Infrastructure complying with firebase-integration-rpc
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validate Connection to Firestore on application boot
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firestore] Connected to MoHCC encrypted database instance.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firestore] Client is offline or database instance is starting.');
    }
    return false;
  }
}

// Execute connection test on boot
testConnection();

/**
 * Real-time Document Listeners
 */
export function subscribeDocuments(
  onUpdate: (docs: HealthDocument[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'documents';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const records: HealthDocument[] = [];
      snapshot.forEach((d) => {
        records.push(d.data() as HealthDocument);
      });
      // Sort in memory by dateCreated descending
      records.sort(
        (a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
      );
      onUpdate(records);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

/**
 * Real-time Chained Audit Log Listeners
 */
export function subscribeAuditLogs(
  onUpdate: (logs: AuditLogEntry[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'auditLogs';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const logs: AuditLogEntry[] = [];
      snapshot.forEach((d) => {
        logs.push(d.data() as AuditLogEntry);
      });
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onUpdate(logs);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

/**
 * Real-time System Notifications Listeners
 */
export function subscribeNotifications(
  onUpdate: (notifications: SystemNotification[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'notifications';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: SystemNotification[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as SystemNotification);
      });
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

/**
 * Persist document to Firestore
 */
export async function persistDocument(docData: HealthDocument): Promise<void> {
  const path = `documents/${docData.id}`;
  try {
    await setDoc(doc(db, 'documents', docData.id), docData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Update document status or metadata in Firestore
 */
export async function updateDocumentRecord(
  docId: string,
  updates: Partial<HealthDocument>
): Promise<void> {
  const path = `documents/${docId}`;
  try {
    await updateDoc(doc(db, 'documents', docId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Append audit log entry to Firestore
 */
export async function persistAuditLog(log: AuditLogEntry): Promise<void> {
  const path = `auditLogs/${log.id}`;
  try {
    await setDoc(doc(db, 'auditLogs', log.id), log);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Mark notification as read in Firestore
 */
export async function updateNotificationStatus(
  notificationId: string,
  read: boolean
): Promise<void> {
  const path = `notifications/${notificationId}`;
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { read });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Add a new notification to Firestore
 */
export async function persistNotification(notif: SystemNotification): Promise<void> {
  const path = `notifications/${notif.id}`;
  try {
    await setDoc(doc(db, 'notifications', notif.id), notif);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Seed initial baseline data if Firestore collection is fresh and empty
 */
export async function seedInitialFirestoreData(
  seedDocs: HealthDocument[],
  seedLogs: AuditLogEntry[],
  seedNotifs: SystemNotification[]
): Promise<void> {
  try {
    const docSnap = await getDocs(query(collection(db, 'documents'), limit(1)));
    if (docSnap.empty) {
      console.log('[Firestore] Seeding baseline MoHCC records...');
      for (const d of seedDocs) {
        await setDoc(doc(db, 'documents', d.id), d);
      }
      for (const l of seedLogs) {
        await setDoc(doc(db, 'auditLogs', l.id), l);
      }
      for (const n of seedNotifs) {
        await setDoc(doc(db, 'notifications', n.id), n);
      }
      console.log('[Firestore] Baseline data seeded successfully.');
    }
  } catch (err) {
    console.warn('[Firestore] Seed check skipped or offline:', err);
  }
}

/**
 * Trigger Google Auth popup
 */
export async function signInWithGoogle() {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err) {
    console.error('Google Sign In Error:', err);
    throw err;
  }
}

/**
 * Sign out
 */
export async function logOutFirebase() {
  return await signOut(auth);
}
