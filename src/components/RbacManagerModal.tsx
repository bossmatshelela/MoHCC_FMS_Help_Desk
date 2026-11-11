import React, { useState } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Lock,
  Unlock,
  Check,
  AlertCircle,
  HelpCircle,
  Users,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { Role, Permission, UserProfile, RoleDefinition } from '../types';
import { ROLE_DEFINITIONS, PERMISSION_METADATA } from '../utils/rbac';

interface RbacManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  users: UserProfile[];
  rolePermissions: Record<Role, Permission[]>;
  onUpdateRolePermissions: (role: Role, perms: Permission[]) => void;
  onUpdateUserRole: (userId: string, newRole: Role) => void;
}

export const RbacManagerModal: React.FC<RbacManagerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  rolePermissions,
  onUpdateRolePermissions,
  onUpdateUserRole,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'matrix' | 'users' | 'test'>('matrix');
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<Role>('HELP_DESK_STAFF');
  const [simulatedRole, setSimulatedRole] = useState<Role>('READ_ONLY_VIEWER');
  const [testResult, setTestResult] = useState<string | null>(null);

  const rolesList: Role[] = ['ADMINISTRATOR', 'HELP_DESK_STAFF', 'READ_ONLY_VIEWER', 'MEDICAL_OFFICER'];
  const permissionsList = Object.keys(PERMISSION_METADATA) as Permission[];

  const isCurrentAdmin = currentUser.role === 'ADMINISTRATOR';

  const handleTogglePermission = (role: Role, perm: Permission) => {
    if (!isCurrentAdmin) {
      alert('Only Administrators have permission to modify the RBAC role matrix.');
      return;
    }
    // Prevent stripping admin of core permissions
    if (role === 'ADMINISTRATOR' && perm === 'RBAC_MODIFY_ROLES') {
      alert('Cannot remove RBAC_MODIFY_ROLES from Administrator role.');
      return;
    }

    const currentPerms = rolePermissions[role] || ROLE_DEFINITIONS[role].defaultPermissions;
    const has = currentPerms.includes(perm);
    const updated = has ? currentPerms.filter((p) => p !== perm) : [...currentPerms, perm];
    onUpdateRolePermissions(role, updated);
  };

  const handleRunSimulatedTest = (action: string) => {
    const perms = rolePermissions[simulatedRole] || ROLE_DEFINITIONS[simulatedRole].defaultPermissions;

    if (action === 'access_restricted') {
      if (perms.includes('DOC_VIEW_RESTRICTED_MEDICAL')) {
        setTestResult('ACCESS GRANTED: Role has DOC_VIEW_RESTRICTED_MEDICAL clearance.');
      } else {
        setTestResult(
          'ACCESS DENIED [STRICT ENFORCEMENT]: Sensitive pediatric & maternal health records are strictly blocked for this role. Missing DOC_VIEW_RESTRICTED_MEDICAL permission.'
        );
      }
    } else if (action === 'scan_document') {
      if (perms.includes('DOC_SCAN_INGEST')) {
        setTestResult('ACCESS GRANTED: Role is authorized to operate high-speed scanner and ingest records.');
      } else {
        setTestResult('ACCESS DENIED: Role lacks DOC_SCAN_INGEST permission. Read-Only Viewers cannot ingest documents.');
      }
    } else if (action === 'approve_record') {
      if (perms.includes('DOC_APPROVE_REVIEW')) {
        setTestResult('ACCESS GRANTED: Role is authorized to certify documents and sign regulatory approvals.');
      } else {
        setTestResult('ACCESS DENIED: Role cannot sign off documents. Only Medical Officers and Administrators have review authority.');
      }
    } else if (action === 'modify_rbac') {
      if (perms.includes('RBAC_MODIFY_ROLES')) {
        setTestResult('ACCESS GRANTED: Full administrative governance permitted.');
      } else {
        setTestResult('ACCESS DENIED: RBAC governance is restricted strictly to Administrator role.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  MoHCC Role-Based Access Control (RBAC) &amp; Security Policy
                </h2>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Strict Enforcement Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Define distinct roles ('Administrator', 'Help Desk Staff', 'Read-Only Viewer', 'Medical Officer') and assign granular permissions to protect sensitive health data.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'matrix'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Role &amp; Permissions Matrix
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            User Role Assignments ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'test'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Enforcement &amp; Privacy Simulator
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* TAB 1: Permissions Matrix */}
          {activeTab === 'matrix' && (
            <div className="space-y-6">
              {/* Role Cards Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {rolesList.map((rKey) => {
                  const def = ROLE_DEFINITIONS[rKey];
                  const currentCount = (rolePermissions[rKey] || def.defaultPermissions).length;
                  return (
                    <div
                      key={rKey}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {def.name}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                          {currentCount} Perms
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                        {def.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Matrix Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="py-3 px-4 min-w-[240px]">Permission Name &amp; Description</th>
                        <th className="py-3 px-3 text-center">Administrator</th>
                        <th className="py-3 px-3 text-center">Help Desk Staff</th>
                        <th className="py-3 px-3 text-center">Read-Only Viewer</th>
                        <th className="py-3 px-3 text-center">Medical Officer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {permissionsList.map((permKey) => {
                        const meta = PERMISSION_METADATA[permKey];
                        return (
                          <tr key={permKey} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4">
                              <p className="font-semibold text-slate-900 dark:text-white">{meta.label}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                                {meta.description}
                              </p>
                              <span className="font-mono text-[10px] text-slate-400">{permKey}</span>
                            </td>

                            {rolesList.map((rKey) => {
                              const perms = rolePermissions[rKey] || ROLE_DEFINITIONS[rKey].defaultPermissions;
                              const isChecked = perms.includes(permKey);
                              const isRestrictedMedical = permKey === 'DOC_VIEW_RESTRICTED_MEDICAL';

                              return (
                                <td key={rKey} className="py-3 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePermission(rKey, permKey)}
                                    disabled={!isCurrentAdmin || rKey === 'ADMINISTRATOR'}
                                    className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                                      isChecked
                                        ? isRestrictedMedical
                                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold'
                                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600'
                                    } ${
                                      !isCurrentAdmin ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:scale-105'
                                    }`}
                                    title={isChecked ? 'Allowed (Click to toggle)' : 'Blocked (Click to grant)'}
                                  >
                                    {isChecked ? (
                                      <Check className="w-4 h-4 stroke-[2.5]" />
                                    ) : (
                                      <span className="text-slate-300 dark:text-slate-600">—</span>
                                    )}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: User Role Assignment */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Active Department Staff &amp; Credential Directory
                </p>
                <p className="mt-0.5">
                  Administrators can promote or reassign staff roles. Role changes instantly update system permissions, document visibility, and audit logging contexts.
                </p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                {users.map((usr) => (
                  <div
                    key={usr.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200">
                        {usr.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {usr.name}
                          </h4>
                          {usr.id === currentUser.id && (
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                              Active Session
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{usr.email}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                          <span>Badge: {usr.badgeId}</span>
                          <span>·</span>
                          <span>Dept: {usr.department}</span>
                          <span>·</span>
                          <span>Clearance: {usr.clearance}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-slate-400">Assigned Role:</span>
                      <select
                        value={usr.role}
                        disabled={!isCurrentAdmin}
                        onChange={(e) => onUpdateUserRole(usr.id, e.target.value as Role)}
                        className={`text-xs px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-800 font-semibold ${
                          usr.role === 'ADMINISTRATOR'
                            ? 'text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                            : usr.role === 'HELP_DESK_STAFF'
                            ? 'text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : usr.role === 'MEDICAL_OFFICER'
                            ? 'text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                            : 'text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        } ${!isCurrentAdmin ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <option value="ADMINISTRATOR">Administrator</option>
                        <option value="HELP_DESK_STAFF">Help Desk Staff</option>
                        <option value="READ_ONLY_VIEWER">Read-Only Viewer</option>
                        <option value="MEDICAL_OFFICER">Medical Officer</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Enforcement & Privacy Simulator */}
          {activeTab === 'test' && (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Real-time Compliance &amp; Data Privacy Test Harness</span>
                </p>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  Select a test role and execute attempted file management actions to verify strict RBAC boundary enforcement.
                </p>
              </div>

              {/* Role Selector for Test */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Simulate Target User Role:
                  </label>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    {rolesList.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setSimulatedRole(r);
                          setTestResult(null);
                        }}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          simulatedRole === r
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        {ROLE_DEFINITIONS[r].name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleRunSimulatedTest('access_restricted')}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-500 text-left transition-colors"
                  >
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      1. Open RESTRICTED_MEDICAL Record
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tests access to pediatric growth cards and maternal mortality records.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRunSimulatedTest('scan_document')}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-500 text-left transition-colors"
                  >
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      2. Operate Physical Document Scanner
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tests authorization to scan, OCR analyze, and ingest records.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRunSimulatedTest('approve_record')}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-500 text-left transition-colors"
                  >
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      3. Sign Regulatory Document Approval
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tests clinical and supervisory approval sign-off authority.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRunSimulatedTest('modify_rbac')}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-500 text-left transition-colors"
                  >
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      4. Reconfigure Security &amp; RBAC Roles
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tests permission to modify system security grants and permissions.
                    </p>
                  </button>
                </div>

                {/* Simulator Output */}
                {testResult && (
                  <div
                    className={`mt-3 p-3 rounded-xl border text-xs font-mono leading-relaxed ${
                      testResult.startsWith('ACCESS GRANTED')
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    {testResult}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
          <span>Active Policy: National Health Data Privacy Act &amp; FIPS 140-3</span>
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
