'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface UpcomingQuizProps {
  title?: string;
  startTime?: string;
  participantCount?: number;
}

export function UpcomingQuiz({
  title = 'Grand Physics Battle',
  startTime: startTimeProp,
  participantCount = 2341,
}: UpcomingQuizProps) {
  const [countdown, setCountdown] = useState('');
  const [now] = useState(() => Date.now());
  const startTime = startTimeProp ?? new Date(now + 86400000).toISOString();

  useEffect(() => {
    function update() {
      const diff = new Date(startTime).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('LIVE');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">
            Live at 9 PM
          </span>
        </div>
        <h3 className="text-2xl font-bold mb-4">{title}</h3>
        <div className="flex gap-8 mb-6">
          <div>
            <span className="text-2xl font-bold block tabular-nums">{countdown}</span>
            <span className="text-[10px] uppercase tracking-widest opacity-70">
              {countdown === 'LIVE' ? 'Now' : 'Countdown'}
            </span>
          </div>
          <div className="w-px bg-white/20" />
          <div>
            <span className="text-2xl font-bold block">{participantCount.toLocaleString()}</span>
            <span className="text-[10px] uppercase tracking-widest opacity-70">Students</span>
          </div>
        </div>
        <Link
          href="/live-quiz"
          className="block w-full bg-white text-primary font-bold py-3 rounded-xl uppercase tracking-widest text-xs text-center hover:bg-bg transition-colors"
        >
          {countdown === 'LIVE' ? 'Join Now' : 'Set Reminder'}
        </Link>
      </div>
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 blur-3xl rounded-full" />
    </div>
  );
}
