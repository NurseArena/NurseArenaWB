'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useExam } from '@/hooks/useExam';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LogoIcon } from '@/components/LogoIcon';

export function SettingsEnrollment() {
  const user = useAuthStore((s) => s.user);
  const { examName, examColor } = useExam();

  return (
    <Card className="p-5">
      <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
        <LogoIcon size={18} /> Current Exam
      </h2>

      <div className="flex items-center justify-between p-4 bg-surface2 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: examColor + '20' }}>
            <LogoIcon size={20} />
          </div>
          <div>
            <p className="font-bold text-ink">{examName}</p>
            <p className="text-xs text-ink-muted">
              Marks: {user?.totalMarksEarned ?? 0} · Best Mock: {user?.bestMockScore ?? 0}%
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
