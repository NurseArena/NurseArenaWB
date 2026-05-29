'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useExam } from '@/hooks/useExam';
import { ExamBadge } from '@/components/exam/ExamBadge';
import { Card } from '@/components/ui/card';
import { ScrollText, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function PYQPage() {
  useExam();
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('questions')
      .select('pyq_year')
      .eq('is_pyq', true)
      .not('pyq_year', 'is', null)
      .then((res: { data: unknown }) => {
        const data = res.data as Record<string, unknown>[] | null;
        if (data) {
          const unique = [...new Set(data.map((q) => q.pyq_year as number))].filter(Boolean).sort((a, b) => (b as number) - (a as number));
          setYears(unique as number[]);
        }
      });
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">Previous Year Questions</h1>
          <p className="text-sm text-ink-muted mt-1">Practice with real exam papers</p>
        </div>
        <ExamBadge />
      </div>

      {years.length === 0 && (
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <ScrollText size={32} className="text-primary" />
          </div>
          <p className="text-ink-muted italic">PYQs will appear here once uploaded</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {years.map((year) => (
          <Link key={year} href={`/quiz/pyq?year=${year}`}>
            <Card className="p-5 hover:border-primary/30 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-ink">{year}</p>
                  <p className="text-xs text-ink-muted">Question Paper</p>
                </div>
                <ChevronRight size={20} className="text-ink-muted group-hover:text-primary transition-colors" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
