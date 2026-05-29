export interface ExamSubject {
  name: string;
  icon: string;
  catI: number;
  catII: number;
  totalQ: number;
  marks: number;
}

export interface ExamConfig {
  code: string;
  name: string;
  shortName: string;
  color: string;
  totalQuestions: number;
  maxMarks: number;
  durationSeconds: number;
  hasNegativeMarking: boolean;
  partialCredit: boolean;
  subjects: ExamSubject[];
  category: ('I' | 'II')[];
}

export const EXAMS: Record<string, ExamConfig> = {
  'JENPAS_UG_P1': {
    code: 'JENPAS_UG_P1',
    name: 'JENPAS (UG)',
    shortName: 'JENPAS UG',
    color: '#6366f1',
    totalQuestions: 100,
    maxMarks: 115,
    durationSeconds: 7200,
    hasNegativeMarking: true,
    partialCredit: true,
    category: ['I', 'II'],
    subjects: [
      { name: 'Physics', icon: '⚛️', catI: 15, catII: 5, totalQ: 20, marks: 25 },
      { name: 'Chemistry', icon: '🧪', catI: 15, catII: 5, totalQ: 20, marks: 25 },
      { name: 'Biology', icon: '🧬', catI: 15, catII: 5, totalQ: 20, marks: 25 },
      { name: 'Basic English', icon: '📖', catI: 20, catII: 0, totalQ: 20, marks: 20 },
      { name: 'Health Aptitude', icon: '🏥', catI: 20, catII: 0, totalQ: 20, marks: 20 },
    ],
  },
  'JENPAS_UG_P2': {
    code: 'JENPAS_UG_P2',
    name: 'JENPAS (UG) — Paper II (BHA)',
    shortName: 'JENPAS UG P2',
    color: '#8b5cf6',
    totalQuestions: 100,
    maxMarks: 115,
    durationSeconds: 7200,
    hasNegativeMarking: true,
    partialCredit: true,
    category: ['I', 'II'],
    subjects: [
      { name: 'Physical Science', icon: '🔬', catI: 25, catII: 5, totalQ: 30, marks: 35 },
      { name: 'Mathematics', icon: '📐', catI: 10, catII: 5, totalQ: 15, marks: 20 },
      { name: 'General Knowledge', icon: '🌍', catI: 10, catII: 5, totalQ: 15, marks: 20 },
      { name: 'Basic English', icon: '📖', catI: 20, catII: 0, totalQ: 20, marks: 20 },
      { name: 'Logical Reasoning', icon: '🧠', catI: 20, catII: 0, totalQ: 20, marks: 20 },
    ],
  },
  'ANM_GNM': {
    code: 'ANM_GNM',
    name: 'ANM & GNM',
    shortName: 'ANM/GNM',
    color: '#ec4899',
    totalQuestions: 100,
    maxMarks: 115,
    durationSeconds: 7200,
    hasNegativeMarking: true,
    partialCredit: true,
    category: ['I', 'II'],
    subjects: [
      { name: 'Life Science', icon: '🧬', catI: 30, catII: 10, totalQ: 40, marks: 50 },
      { name: 'Physical Science', icon: '🔬', catI: 15, catII: 5, totalQ: 20, marks: 25 },
      { name: 'Basic English', icon: '📖', catI: 15, catII: 0, totalQ: 15, marks: 15 },
      { name: 'Mathematics', icon: '📐', catI: 10, catII: 0, totalQ: 10, marks: 10 },
      { name: 'General Knowledge', icon: '🌍', catI: 10, catII: 0, totalQ: 10, marks: 10 },
      { name: 'Logical Reasoning', icon: '🧠', catI: 5, catII: 0, totalQ: 5, marks: 5 },
    ],
  },
  'JEPBN': {
    code: 'JEPBN',
    name: 'JEPBN 2026',
    shortName: 'JEPBN',
    color: '#f59e0b',
    totalQuestions: 100,
    maxMarks: 100,
    durationSeconds: 5400,
    hasNegativeMarking: true,
    partialCredit: false,
    category: ['I'],
    subjects: [
      { name: 'Anatomy', icon: '🦴', catI: 5, catII: 0, totalQ: 5, marks: 5 },
      { name: 'Physiology', icon: '🫀', catI: 5, catII: 0, totalQ: 5, marks: 5 },
      { name: 'Microbiology', icon: '🦠', catI: 5, catII: 0, totalQ: 5, marks: 5 },
      { name: 'Pathology', icon: '🔬', catI: 5, catII: 0, totalQ: 5, marks: 5 },
      { name: 'Pharmacology', icon: '💊', catI: 5, catII: 0, totalQ: 5, marks: 5 },
      { name: 'Nutrition', icon: '🥗', catI: 5, catII: 0, totalQ: 5, marks: 5 },
      { name: 'Psychology', icon: '🧠', catI: 5, catII: 0, totalQ: 5, marks: 5 },
      { name: 'Sociology', icon: '👥', catI: 5, catII: 0, totalQ: 5, marks: 5 },
      { name: 'Fundamentals of Nursing', icon: '📋', catI: 10, catII: 0, totalQ: 10, marks: 10 },
      { name: 'Medical-Surgical Nursing', icon: '🏥', catI: 10, catII: 0, totalQ: 10, marks: 10 },
      { name: 'Pediatric Nursing', icon: '👶', catI: 10, catII: 0, totalQ: 10, marks: 10 },
      { name: 'Psychiatric Nursing', icon: '🧠', catI: 10, catII: 0, totalQ: 10, marks: 10 },
      { name: 'Obstetrical Nursing', icon: '🤰', catI: 10, catII: 0, totalQ: 10, marks: 10 },
      { name: 'Community Health Nursing', icon: '🌍', catI: 10, catII: 0, totalQ: 10, marks: 10 },
    ],
  },
  'JEMSCN': {
    code: 'JEMSCN',
    name: 'JEMScN 2026',
    shortName: 'JEMScN',
    color: '#10b981',
    totalQuestions: 100,
    maxMarks: 100,
    durationSeconds: 5400,
    hasNegativeMarking: true,
    partialCredit: false,
    category: ['I'],
    subjects: [
      { name: 'Part A — Basic & Allied Sciences', icon: '🔬', catI: 40, catII: 0, totalQ: 40, marks: 40 },
      { name: 'Part B — Core Clinical Nursing', icon: '🏥', catI: 60, catII: 0, totalQ: 60, marks: 60 },
    ],
  },
  'JEMAS_MHA': {
    code: 'JEMAS_MHA',
    name: 'JEMAS PG — MHA',
    shortName: 'JEMAS MHA',
    color: '#a855f7',
    totalQuestions: 100,
    maxMarks: 100,
    durationSeconds: 5400,
    hasNegativeMarking: true,
    partialCredit: false,
    category: ['I'],
    subjects: [
      { name: 'General Science', icon: '🔬', catI: 30, catII: 0, totalQ: 30, marks: 30 },
      { name: 'Logical Reasoning', icon: '🧠', catI: 20, catII: 0, totalQ: 20, marks: 20 },
      { name: 'General Knowledge', icon: '🌍', catI: 20, catII: 0, totalQ: 20, marks: 20 },
      { name: 'English Language', icon: '📖', catI: 20, catII: 0, totalQ: 20, marks: 20 },
      { name: 'Arithmetic', icon: '📐', catI: 10, catII: 0, totalQ: 10, marks: 10 },
    ],
  },
  'JEMAS_MPH': {
    code: 'JEMAS_MPH',
    name: 'JEMAS PG — MPH',
    shortName: 'JEMAS MPH',
    color: '#a855f7',
    totalQuestions: 100,
    maxMarks: 100,
    durationSeconds: 5400,
    hasNegativeMarking: true,
    partialCredit: false,
    category: ['I'],
    subjects: [
      { name: 'Medical Sciences', icon: '🩺', catI: 35, catII: 0, totalQ: 35, marks: 35 },
      { name: 'Social Sciences', icon: '👥', catI: 35, catII: 0, totalQ: 35, marks: 35 },
      { name: 'Biological Science', icon: '🧬', catI: 15, catII: 0, totalQ: 15, marks: 15 },
      { name: 'Statistical Ability & PH GK', icon: '📊', catI: 15, catII: 0, totalQ: 15, marks: 15 },
    ],
  },
  'JEMAS_MLT': {
    code: 'JEMAS_MLT',
    name: 'JEMAS PG — M.Sc. MLT',
    shortName: 'JEMAS MLT',
    color: '#a855f7',
    totalQuestions: 100,
    maxMarks: 100,
    durationSeconds: 5400,
    hasNegativeMarking: true,
    partialCredit: false,
    category: ['I'],
    subjects: [
      { name: 'Biochemistry', icon: '🔬', catI: 35, catII: 0, totalQ: 35, marks: 35 },
      { name: 'Microbiology', icon: '🦠', catI: 35, catII: 0, totalQ: 35, marks: 35 },
      { name: 'Hematology', icon: '🩸', catI: 30, catII: 0, totalQ: 30, marks: 30 },
    ],
  },
  'JEMAS_MAN': {
    code: 'JEMAS_MAN',
    name: 'JEMAS PG — MAN',
    shortName: 'JEMAS MAN',
    color: '#a855f7',
    totalQuestions: 100,
    maxMarks: 100,
    durationSeconds: 5400,
    hasNegativeMarking: true,
    partialCredit: false,
    category: ['I'],
    subjects: [
      { name: 'Physiology & Anatomy', icon: '🫀', catI: 25, catII: 0, totalQ: 25, marks: 25 },
      { name: 'Biochemistry & Food Sciences', icon: '🧪', catI: 25, catII: 0, totalQ: 25, marks: 25 },
      { name: 'Basic Nutrition & Community Health', icon: '🥗', catI: 25, catII: 0, totalQ: 25, marks: 25 },
      { name: 'Maternal & Child Nutrition', icon: '👶', catI: 25, catII: 0, totalQ: 25, marks: 25 },
    ],
  },
  'JEMAS_MBT': {
    code: 'JEMAS_MBT',
    name: 'JEMAS PG — M.Sc. MBT',
    shortName: 'JEMAS MBT',
    color: '#a855f7',
    totalQuestions: 100,
    maxMarks: 100,
    durationSeconds: 5400,
    hasNegativeMarking: true,
    partialCredit: false,
    category: ['I'],
    subjects: [
      { name: 'Nucleotides & Nucleic Acids', icon: '🧬', catI: 25, catII: 0, totalQ: 25, marks: 25 },
      { name: 'Genes & Molecular Enzymology', icon: '🧫', catI: 25, catII: 0, totalQ: 25, marks: 25 },
      { name: 'Protein Chemistry', icon: '🧪', catI: 25, catII: 0, totalQ: 25, marks: 25 },
      { name: 'Carbohydrates, Lipids & Biomembranes', icon: '💧', catI: 25, catII: 0, totalQ: 25, marks: 25 },
    ],
  },
  'JEMAS_MPHILCP': {
    code: 'JEMAS_MPHILCP',
    name: 'JEMAS PG — M.Phil CP',
    shortName: 'JEMAS M.Phil CP',
    color: '#a855f7',
    totalQuestions: 100,
    maxMarks: 100,
    durationSeconds: 5400,
    hasNegativeMarking: true,
    partialCredit: false,
    category: ['I'],
    subjects: [
      { name: 'General & Clinical Psychology', icon: '🧠', catI: 30, catII: 0, totalQ: 30, marks: 30 },
      { name: 'Developmental & Social Psychology', icon: '👥', catI: 25, catII: 0, totalQ: 25, marks: 25 },
      { name: 'Biological Psychology & Sociology', icon: '🔬', catI: 25, catII: 0, totalQ: 25, marks: 25 },
      { name: 'Psychiatry Basics & GK', icon: '📋', catI: 20, catII: 0, totalQ: 20, marks: 20 },
    ],
  },
  'JEMAS_MPHILPSW': {
    code: 'JEMAS_MPHILPSW',
    name: 'JEMAS PG — M.Phil PSW',
    shortName: 'JEMAS M.Phil PSW',
    color: '#a855f7',
    totalQuestions: 100,
    maxMarks: 100,
    durationSeconds: 5400,
    hasNegativeMarking: true,
    partialCredit: false,
    category: ['I'],
    subjects: [
      { name: 'General & Clinical Psychology', icon: '🧠', catI: 30, catII: 0, totalQ: 30, marks: 30 },
      { name: 'Developmental & Social Psychology', icon: '👥', catI: 25, catII: 0, totalQ: 25, marks: 25 },
      { name: 'Biological Psychology & Sociology', icon: '🔬', catI: 25, catII: 0, totalQ: 25, marks: 25 },
      { name: 'Psychiatry Basics & GK', icon: '📋', catI: 20, catII: 0, totalQ: 20, marks: 20 },
    ],
  },
};

export type ExamCode = keyof typeof EXAMS;
