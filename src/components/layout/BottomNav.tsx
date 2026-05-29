'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Swords, Zap, Trophy, User } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', href: '/dashboard' },
  { icon: Swords, label: 'Practice', href: '/subjects' },
  { icon: Zap, label: 'Rapid', href: '/rapid-fire' },
  { icon: Trophy, label: 'Rankings', href: '/leaderboard' },
  { icon: User, label: 'Profile', href: '/profile' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-surface/80 backdrop-blur-lg border-t border-border z-50 px-2 flex justify-around items-center rounded-t-2xl">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center transition-all duration-300 px-3 py-2 rounded-xl',
              isActive ? 'text-primary scale-110' : 'text-ink-muted opacity-60'
            )}
          >
            <item.icon size={22} />
            <span className="text-[10px] font-bold uppercase tracking-widest mt-1">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
