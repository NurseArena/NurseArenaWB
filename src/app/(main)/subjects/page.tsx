'use client';
import { motion } from 'framer-motion';
import { SubjectGrid } from '@/components/exam/SubjectGrid';
import { ExamBadge } from '@/components/exam/ExamBadge';

export default function SubjectsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">Topic-wise Practice</h1>
          <p className="text-sm text-ink-muted mt-1">
            Choose a topic to practice
          </p>
        </div>
        <ExamBadge />
      </div>
      <SubjectGrid />
    </motion.div>
  );
}
