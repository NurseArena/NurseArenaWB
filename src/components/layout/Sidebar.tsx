'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  Swords,
  Zap,
  Trophy,
  BarChart3,
  User,
  ScrollText,
} from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: BookOpen, label: 'Topic-wise', href: '/subjects' },
  { icon: Swords, label: 'Mock Test', href: '/mock-test' },
  { icon: Zap, label: 'Rapid Fire', href: '/rapid-fire' },
  { icon: ScrollText, label: 'PYQs', href: '/pyq' },
  { icon: Trophy, label: 'Leaderboard', href: '/leaderboard' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: BookOpen, label: 'Live Quiz', href: '/live-quiz' },
  { icon: User, label: 'Profile', href: '/profile' },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const displayName = user?.displayName ?? 'Welcome';

  return (
    <aside className="hidden lg:flex w-64 flex-col fixed left-0 top-0 h-full bg-surface border-r border-border z-40">
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <LogoIcon size={40} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-ink">NurseArena</h1>
            <p className="text-[10px] text-ink-muted uppercase tracking-widest font-semibold">
              Exam Prep
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-ink-muted hover:bg-surface2 hover:text-ink'
              )}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">{displayName}</p>
            <p className="text-[10px] text-ink-muted">NurseArena</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
