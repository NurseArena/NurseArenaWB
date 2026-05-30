'use client';
import { motion } from 'framer-motion';
import { useExam } from '@/hooks/useExam';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function SubjectGrid() {
  const { subjects } = useExam();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {subjects.map((subject, i) => (
        <motion.div
          key={subject.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Link
            href={`/subjects?subject=${subject.name}`}
            className="block bg-surface border border-border hover:border-primary/30 rounded-2xl p-5 transition-all shadow-card group"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">{subject.icon}</span>
              <ArrowRight size={18} className="text-ink-muted group-hover:text-primary transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-ink">{subject.name}</h3>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
