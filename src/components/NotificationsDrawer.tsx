import React, { useState } from 'react';
import {
  X,
  Bell,
  Clock,
  ShieldAlert,
  AlertCircle,
  Check,
  CheckCheck,
  ArrowRight,
  Sparkles,
  Calendar,
  Send,
  Filter,
} from 'lucide-react';
import { SystemNotification, NotificationType } from '../types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SystemNotification[];
  onMarkAllAsRead: () => void;
  onSelectNotification: (notif: SystemNotification) => void;
  onTriggerSimulatedNotification: (type: NotificationType) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onSelectNotification,
  onTriggerSimulatedNotification,
}) => {
  if (!isOpen) return null;

  const [filterType, setFilterType] = useState<string>('ALL');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'ALL') return true;
    return n.type === filterType;
  });

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'REVIEW_PENDING':
        return <Clock className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'UPCOMING_DEADLINE':
        return <Calendar className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'SECURITY_ALERT':
        return <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />;
      case 'SYSTEM_UPDATE':
        return <Sparkles className="w-4 h-4 text-sky-500 shrink-0" />;
    }
  };

  const getBadgeText = (type: NotificationType) => {
    switch (type) {
      case 'REVIEW_PENDING':
        return 'Review Pending';
      case 'UPCOMING_DEADLINE':
        return 'Regulatory Deadline';
      case 'SECURITY_ALERT':
        return 'Security Alert';
      case 'SYSTEM_UPDATE':
        return 'System Update';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  MoHCC Automated Notification Center
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {unreadCount} unread alert{unreadCount === 1 ? '' : 's'} · Real-time pipeline
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark All Read</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1 overflow-x-auto text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                filterType === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilterType('UPCOMING_DEADLINE')}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                filterType === 'UPCOMING_DEADLINE'
                  ? 'bg-rose-700 text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Deadlines
            </button>
            <button
              onClick={() => setFilterType('REVIEW_PENDING')}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                filterType === 'REVIEW_PENDING'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Pending Reviews
            </button>
            <button
              onClick={() => setFilterType('SYSTEM_UPDATE')}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                filterType === 'SYSTEM_UPDATE'
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              System Updates
            </button>
            <button
              onClick={() => setFilterType('SECURITY_ALERT')}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                filterType === 'SECURITY_ALERT'
                  ? 'bg-purple-700 text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Security
            </button>
          </div>

          {/* List of Notifications */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-1">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No notifications matching active filter.
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => onSelectNotification(n)}
                  className={`p-3.5 rounded-xl transition-colors cursor-pointer border ${
                    !n.read
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {getIcon(n.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase">
                          {getBadgeText(n.type)}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                          )}
                        </div>
                      </div>

                      <h4
                        className={`text-xs font-bold mt-0.5 ${
                          !n.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {n.title}
                      </h4>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {n.message}
                      </p>

                      {/* Deadline timestamp */}
                      {n.deadlineDate && (
                        <div className="mt-2 p-1.5 bg-rose-50 dark:bg-rose-950/50 rounded-md border border-rose-200 dark:border-rose-900/60 text-[11px] text-rose-700 dark:text-rose-300 font-mono flex items-center justify-between">
                          <span>DEADLINE DUE:</span>
                          <span className="font-bold">
                            {new Date(n.deadlineDate).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}

                      {/* Action CTA */}
                      {n.targetDocId && (
                        <div className="mt-2 text-right">
                          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold inline-flex items-center gap-0.5 hover:underline">
                            Open Target Record <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Trigger Simulation Footer */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Simulate Incoming Automated Alert:
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => onTriggerSimulatedNotification('UPCOMING_DEADLINE')}
                className="px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:border-emerald-500"
              >
                + Deadline Alert
              </button>
              <button
                type="button"
                onClick={() => onTriggerSimulatedNotification('REVIEW_PENDING')}
                className="px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:border-emerald-500"
              >
                + Review Alert
              </button>
              <button
                type="button"
                onClick={() => onTriggerSimulatedNotification('SYSTEM_UPDATE')}
                className="px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:border-emerald-500"
              >
                + System Update
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
