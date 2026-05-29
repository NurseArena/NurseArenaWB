'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, CalendarDays, Swords } from 'lucide-react';
import { isWithinWindow, getTimeUntilEvent } from '@/services/mockTests';

interface MockTestCountdownProps {
  id: number;
  examName: string;
  scheduledAt: string;
  durationMin: number;
  maxParticipants?: number;
  onJoin: (id: number) => void;
}

export function MockTestCountdown({ id, examName, scheduledAt, durationMin, maxParticipants, onJoin }: MockTestCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilEvent(scheduledAt));
  const [active, setActive] = useState(isWithinWindow(scheduledAt, durationMin));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntilEvent(scheduledAt));
      setActive(isWithinWindow(scheduledAt, durationMin));
    }, 1000);
    return () => clearInterval(interval);
  }, [scheduledAt, durationMin]);

  const formatTime = (value: number, label: string) => (
    <div className="text-center">
      <span className="text-2xl font-bold text-ink tabular-nums block">{value.toString().padStart(2, '0')}</span>
      <span className="text-[10px] uppercase tracking-widest text-ink-muted">{label}</span>
    </div>
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-ink">{examName} Mock Test</h3>
          <p className="text-xs text-ink-muted">{durationMin} minutes · {maxParticipants ?? 'Unlimited'} slots</p>
        </div>
        {active && <span className="w-2 h-2 rounded-full bg-success animate-pulse" />}
      </div>

      {!active && !timeLeft.isActive && (
        <div className="flex items-center gap-4 mb-6">
          {formatTime(timeLeft.days, 'Days')}
          <span className="text-2xl text-ink-muted">:</span>
          {formatTime(timeLeft.hours, 'Hrs')}
          <span className="text-2xl text-ink-muted">:</span>
          {formatTime(timeLeft.minutes, 'Min')}
          <span className="text-2xl text-ink-muted">:</span>
          {formatTime(timeLeft.seconds, 'Sec')}
        </div>
      )}

      {active && (
        <div className="flex items-center gap-3 mb-6 p-3 bg-success/10 rounded-xl">
          <Clock size={20} className="text-success" />
          <span className="text-sm font-bold text-success">Test window is active!</span>
        </div>
      )}

      <Button
        size="lg"
        className="w-full"
        onClick={() => onJoin(id)}
        disabled={!active}
      >
        {active ? (
          <><Swords size={18} /> Join Now</>
        ) : (
          <><CalendarDays size={18} /> Not Yet Open</>
        )}
      </Button>
    </Card>
  );
}
