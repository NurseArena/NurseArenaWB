'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { EXAMS } from '@/lib/exam-config';
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react';

const EXAM_TOPICS: Record<string, Record<string, string[]>> = {
  'JENPAS_UG_P1': {
    'Physics': ['Units & Dimensions', 'Kinematics & Vectors', 'Laws of Motion', 'Work, Energy & Power', 'Thermodynamics', 'Optics', 'Electrostatics', 'Semiconductors'],
    'Chemistry': ['Atomic Structure', 'Chemical Bonding', 'Thermodynamics', 'Equilibrium', 'Organic Chemistry', 'Biomolecules', 'Polymers'],
    'Biology': ['Cell Biology', 'Human Physiology', 'Plant Physiology', 'Genetics & Evolution', 'Biotechnology', 'Ecology'],
    'Basic English': ['Grammar', 'Vocabulary', 'Reading Comprehension', 'Error Detection'],
    'Health Aptitude': ['Human Body Systems', 'Nutrition', 'Hygiene & Public Health'],
  },
  'ANM_GNM': {
    'Life Science': ['Cell Biology', 'Human Physiology', 'Plant Physiology', 'Genetics', 'Health & Disease', 'Ecology'],
    'Physical Science': ['Measurements', 'Force & Motion', 'Light & Optics', 'Electricity', 'Chemistry Basics'],
    'Basic English': ['Grammar', 'Vocabulary', 'Comprehension'],
    'Mathematics': ['Arithmetic', 'Algebra', 'Geometry'],
    'General Knowledge': ['Geography', 'History', 'Polity', 'Current Affairs'],
    'Logical Reasoning': ['Verbal Reasoning', 'Non-Verbal Reasoning'],
  },
};

export default function AdminExamMappingPage() {
  const [expandedExam, setExpandedExam] = useState<string | null>(null);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h1 className="text-3xl font-bold text-ink">Exam → Subject → Topic Mapping</h1>
      <p className="text-sm text-ink-muted">View the exam structure hierarchy</p>

      <div className="space-y-4">
        {Object.entries(EXAMS).map(([code, exam]) => (
          <Card key={code} className="overflow-hidden">
            <button
              onClick={() => setExpandedExam(expandedExam === code ? null : code)}
              className="w-full flex items-center justify-between p-5 hover:bg-surface2 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: exam.color }} />
                <span className="font-bold text-ink">{exam.name}</span>
                <span className="text-xs text-ink-muted">({exam.totalQuestions} Q / {exam.maxMarks} marks)</span>
              </div>
              {expandedExam === code ? <ChevronDown size={20} className="text-ink-muted" /> : <ChevronRight size={20} className="text-ink-muted" />}
            </button>

            {expandedExam === code && (
              <div className="border-t border-border p-5 space-y-4">
                {exam.subjects.map((subj) => (
                  <div key={subj.name}>
                    <button
                      onClick={() => setExpandedSubject(expandedSubject === subj.name ? null : subj.name)}
                      className="flex items-center gap-2 text-sm font-medium text-ink hover:text-primary transition-colors"
                    >
                      <BookOpen size={16} className="text-ink-muted" />
                      {subj.name}
                      <span className="text-xs text-ink-muted">({subj.totalQ} Q · {subj.catI > 0 ? `${subj.catI} Cat I` : ''}{subj.catII > 0 ? ` + ${subj.catII} Cat II` : ''})</span>
                      {expandedSubject === subj.name ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    {expandedSubject === subj.name && (
                      <div className="ml-6 mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                        {(EXAM_TOPICS[code]?.[subj.name] ?? ['Topic 1', 'Topic 2', 'Topic 3']).map((topic) => (
                          <div key={topic} className="bg-surface2 rounded-lg px-3 py-2 text-xs text-ink-muted">
                            {topic}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
