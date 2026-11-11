import React, { useState } from 'react';
import {
  FileText,
  Shield,
  Bell,
  Sun,
  Moon,
  Camera,
  ChevronDown,
  UserCheck,
  Check,
  KeyRound,
  Fingerprint,
} from 'lucide-react';
import { UserProfile, Role } from '../types';

interface HeaderProps {
  currentUser: UserProfile;
  availableUsers: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  activeTab: 'dashboard' | 'documents' | 'audit' | 'api';
  onSelectTab: (tab: 'dashboard' | 'documents' | 'audit' | 'api') => void;
  unreadNotificationCount: number;
  onOpenNotifications: () => void;
  onOpenScanner: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenMfaTest: () => void;
  onOpenRbacManager: () => void;
  onGoogleSignIn: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  availableUsers,
  onSelectUser,
  activeTab,
  onSelectTab,
  unreadNotificationCount,
  onOpenNotifications,
  onOpenScanner,
  isDarkMode,
  onToggleDarkMode,
  onOpenMfaTest,
  onOpenRbacManager,
  onGoogleSignIn,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const getRoleDisplayName = (role: Role) => {
    switch (role) {
      case 'ADMINISTRATOR':
        return 'Administrator';
      case 'HELP_DESK_STAFF':
        return 'Help Desk Staff';
      case 'READ_ONLY_VIEWER':
        return 'Read-Only Viewer';
      case 'MEDICAL_OFFICER':
        return 'Medical Officer (RMNCH)';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4 lg:gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden ring-1 ring-slate-900/10 dark:ring-white/10 shrink-0 bg-slate-900">
              <img
                src="/src/assets/images/mohcc_official_emblem_1794339727923.jpg"
                alt="Ministry of Health and Child Care Crest"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                  MoHCC IT Help Desk
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Cloud Firestore (europe-west2)</span>
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Document Management &amp; Secure Cloud Archive
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`transition-colors whitespace-nowrap py-1 ${
                activeTab === 'dashboard'
                  ? 'text-emerald-700 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onSelectTab('documents')}
              className={`transition-colors whitespace-nowrap py-1 ${
                activeTab === 'documents'
                  ? 'text-emerald-700 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Document Vault
            </button>
            <button
              onClick={() => onSelectTab('audit')}
              className={`transition-colors whitespace-nowrap py-1 ${
                activeTab === 'audit'
                  ? 'text-emerald-700 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Audit Trail
            </button>
            <button
              onClick={() => onSelectTab('api')}
              className={`transition-colors whitespace-nowrap py-1 ${
                activeTab === 'api'
                  ? 'text-emerald-700 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Developer API
            </button>
          </nav>

          {/* Zone 3: Primary Action & Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Scan Document Primary CTA */}
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 rounded-lg shadow-xs transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-emerald-600"
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>Scan &amp; Ingest</span>
            </button>

            {/* Quick 2FA / Biometric verification prompt button */}
            <button
              onClick={onOpenMfaTest}
              title="Security Authentication (MFA / Biometric)"
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Security Authentication"
            >
              <Fingerprint className="w-5 h-5" />
            </button>

            {/* RBAC Security & Permissions Manager Button */}
            <button
              onClick={onOpenRbacManager}
              title="Role-Based Access Control (RBAC) & Permissions Policy"
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="RBAC Governance"
            >
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="System Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 text-[10px] font-bold text-white bg-rose-600 rounded-full flex items-center justify-center">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                aria-expanded={userDropdownOpen}
              >
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div className="hidden lg:flex flex-col text-xs leading-tight">
                  <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">
                    {currentUser.name}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                    {currentUser.role.replace('_', ' ')}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-40">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Switch Active Role (RBAC)
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        Test access control and permissions
                      </p>
                    </div>
                    {availableUsers.map((user) => {
                      const isSelected = user.id === currentUser.id;
                      return (
                        <button
                          key={user.id}
                          onClick={() => {
                            onSelectUser(user);
                            setUserDropdownOpen(false);
                          }}
                          className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="mt-0.5 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium truncate">{user.name}</p>
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {getRoleDisplayName(user.role)}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                              <span>Clearance: {user.clearance}</span>
                              {user.biometricActive && <span>· Biometric Active</span>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          onGoogleSignIn();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Sign In with Google (Firebase)</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="flex md:hidden border-t border-slate-200 dark:border-slate-800 px-4 py-2 bg-slate-50 dark:bg-slate-900/90 gap-1 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'bg-emerald-600 text-white font-semibold'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onSelectTab('documents')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'documents'
              ? 'bg-emerald-600 text-white font-semibold'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Documents
        </button>
        <button
          onClick={() => onSelectTab('audit')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-emerald-600 text-white font-semibold'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Audit Trail
        </button>
        <button
          onClick={() => onSelectTab('api')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'api'
              ? 'bg-emerald-600 text-white font-semibold'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Developer API
        </button>
      </div>
    </header>
  );
};
