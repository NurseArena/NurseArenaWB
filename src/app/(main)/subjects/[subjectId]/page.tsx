'use client';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { useExam } from '@/hooks/useExam';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play } from 'lucide-react';
import Link from 'next/link';

export default function SubjectDetailPage() {
  const params = useParams();
  const { subjects, examName } = useExam();
  const subject = subjects.find((s) => s.name === params.subjectId);

  if (!subject) {
    return (
      <div className="text-center py-20">
        <p className="text-ink-muted italic">Subject not found</p>
        <Link href="/subjects" className="text-primary font-bold mt-4 inline-block">
          Back to subjects
        </Link>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Link
        href="/subjects"
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={18} />
        Back to subjects
      </Link>

      <div className="flex items-center gap-4">
        <span className="text-5xl">{subject.icon}</span>
        <div>
          <h1 className="text-3xl font-bold text-ink">{subject.name}</h1>
          <p className="text-sm text-ink-muted">{examName}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="text-2xl font-bold text-ink">{subject.totalQ}</p>
          <p className="text-xs text-ink-muted">Questions in exam</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="text-2xl font-bold text-primary">{subject.marks}</p>
          <p className="text-xs text-ink-muted">Marks</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-ink">Practice Options</h2>
        <Link href={`/quiz/practice?subject=${subject.name}`}>
          <Button className="w-full" size="lg">
            <Play size={18} />
            Start Practice
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
