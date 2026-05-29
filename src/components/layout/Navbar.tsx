'use client';
import { useSyncExternalStore, useState, useEffect } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { useExam } from '@/hooks/useExam';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';
import { Moon, Sun, Bell, Star, X, Check } from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';
import Link from 'next/link';
import type { Notification } from '@/types/user';
import { marksToXp } from '@/lib/xp';

const emptySubscribe = () => () => {};

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { examName, examColor } = useExam();
  const user = useAuthStore((s) => s.user);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const fetchNotifs = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('id, title, body, type, targetExams, createdAt, readBy')
        .order('created_at', { ascending: false })
        .limit(25);
      if (data) setNotifications(data as Notification[]);
    };
    fetchNotifs();
  }, [user]);

  const unreadCount = notifications.filter(
    (n) => !(n.readBy ?? []).includes(user?.id ?? '')
  ).length;

  const markAsRead = async (notifId: string) => {
    if (!user) return;
    const supabase = createClient();
      await supabase
        .from('notifications')
        .update({ read_by: [...(notifications.find(n => n.id === notifId)?.readBy ?? []), user.id] })
        .eq('id', notifId);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notifId ? { ...n, readBy: [...(n.readBy ?? []), user.id] } : n
      )
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const supabase = createClient();
    const unread = notifications.filter((n) => !(n.readBy ?? []).includes(user.id));
    for (const n of unread) {
      await supabase
        .from('notifications')
        .update({ read_by: [...(n.readBy ?? []), user.id] })
        .eq('id', n.id);
    }
    setNotifications((prev) =>
      prev.map((n) =>
        (n.readBy ?? []).includes(user.id) ? n : { ...n, readBy: [...(n.readBy ?? []), user.id] }
      )
    );
  };

  return (
    <header className="sticky top-0 z-30 glass border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center gap-4 lg:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <LogoIcon size={40} />
            </div>
            <span className="font-bold text-ink text-sm">NurseArena</span>
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: examColor + '15', color: examColor }}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: examColor }} />
            {examName}
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-warning/10 text-warning">
            <Star size={12} />
            {marksToXp(user?.totalMarksEarned ?? 0).toLocaleString()} XP
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              className="relative p-2 rounded-xl hover:bg-surface2 transition-colors text-ink-muted hover:text-ink"
              onClick={() => setShowNotifPanel((v) => !v)}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-danger text-[9px] font-bold text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifPanel && (
              <div className="absolute right-0 top-12 w-80 bg-surface border border-border rounded-2xl shadow-card-lg z-50 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h3 className="font-bold text-ink text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-ink-muted">No notifications</div>
                ) : (
                  notifications.map((n) => {
                    const isRead = (n.readBy ?? []).includes(user?.id ?? '');
                    return (
                      <div
                        key={n.id}
                        className={`p-4 border-b border-border last:border-b-0 hover:bg-surface2 transition-colors ${!isRead ? 'bg-primary/5' : ''}`}
                        onClick={() => markAsRead(n.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`text-sm ${!isRead ? 'font-bold text-ink' : 'text-ink-muted'}`}>
                              {n.title}
                            </p>
                            <p className="text-xs text-ink-muted mt-0.5">{n.body}</p>
                          </div>
                          {!isRead && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-surface2 transition-colors text-ink-muted hover:text-ink"
            aria-label="Toggle theme"
          >
            {mounted ? (theme === 'light' ? <Moon size={20} /> : <Sun size={20} />) : <div className="w-5 h-5" />}
          </button>

          <Link
            href="/profile"
            className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm"
          >
            {user?.displayName?.[0] ?? 'S'}
          </Link>
        </div>
      </div>
    </header>
  );
}
