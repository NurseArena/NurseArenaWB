'use client';
import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';

export type QuestionCategory = 'general' | 'subject' | 'topic' | 'pyq' | 'rapid_fire';

interface UploadRow {
  rowIndex: number;
  data: Record<string, string>;
  errors: string[];
  valid: boolean;
}

const CATEGORY_META: Record<QuestionCategory, { label: string; required: string[]; optional: string[]; csvHeader: string; description: string }> = {
  general: {
    label: 'General',
    required: ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option'],
    optional: ['explanation', 'difficulty', 'subject_id', 'exam_id', 'topic'],
    csvHeader: 'question_text,option_a,option_b,option_c,option_d,correct_option,explanation,difficulty,subject_id,exam_id,topic',
    description: 'question_text, option_a-d, correct_option, explanation, difficulty, subject_id, exam_id, topic',
  },
  subject: {
    label: 'Subject-wise',
    required: ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option', 'subject_id'],
    optional: ['explanation', 'difficulty', 'exam_id', 'topic'],
    csvHeader: 'question_text,option_a,option_b,option_c,option_d,correct_option,subject_id,explanation,difficulty,exam_id,topic',
    description: 'question_text, option_a-d, correct_option, subject_id (required), explanation, difficulty, exam_id, topic',
  },
  topic: {
    label: 'Topic-wise',
    required: ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option', 'topic'],
    optional: ['explanation', 'difficulty', 'subject_id', 'exam_id'],
    csvHeader: 'question_text,option_a,option_b,option_c,option_d,correct_option,topic,explanation,difficulty,subject_id,exam_id',
    description: 'question_text, option_a-d, correct_option, topic (required), explanation, difficulty, subject_id, exam_id',
  },
  pyq: {
    label: 'PYQs',
    required: ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option', 'pyq_year'],
    optional: ['explanation', 'difficulty', 'subject_id', 'exam_id', 'topic'],
    csvHeader: 'question_text,option_a,option_b,option_c,option_d,correct_option,pyq_year,explanation,difficulty,subject_id,exam_id,topic',
    description: 'question_text, option_a-d, correct_option, pyq_year (required), explanation, difficulty, subject_id, exam_id, topic',
  },
  rapid_fire: {
    label: 'Rapid Fire',
    required: ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option'],
    optional: ['explanation', 'difficulty', 'subject_id', 'exam_id', 'topic'],
    csvHeader: 'question_text,option_a,option_b,option_c,option_d,correct_option,explanation,difficulty,subject_id,exam_id,topic',
    description: 'question_text, option_a-d, correct_option, explanation, difficulty, subject_id, exam_id, topic',
  },
};

const COURSE_OPTIONS = [
  { value: '', label: '— Select a course —' },
  { value: 'JEPBN', label: 'JEPBN 2026' },
  { value: 'JENPAS_UG_P1', label: 'JENPAS (UG) — Paper I' },
  { value: 'JENPAS_UG_P2', label: 'JENPAS (UG) — Paper II (BHA)' },
  { value: 'ANM_GNM', label: 'ANM & GNM' },
  { value: 'JEMSCN', label: 'JEMScN 2026' },
  { value: 'JEMAS', label: 'JEMAS (PG)' },
];

export function AdminQuestionUpload({ defaultCategory = 'general' }: { defaultCategory?: QuestionCategory }) {
  const [category, setCategory] = useState<QuestionCategory>(defaultCategory);
  const [course, setCourse] = useState('');
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const meta = CATEGORY_META[category];

  const parseCSV = useCallback((text: string) => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return;
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredLower = meta.required.map(r => r.toLowerCase());
    const parsed: UploadRow[] = [];
    let errorCount = 0;
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = vals[idx] ?? ''; });
      const errors: string[] = [];
      for (const req of requiredLower) {
        if (!row[req]) errors.push(`${req} required`);
      }
      if (row.correct_option && !['a', 'b', 'c', 'd'].includes(row.correct_option.toLowerCase())) {
        errors.push('correct_option must be a/b/c/d');
      }
      if (row.difficulty && !['easy', 'medium', 'hard'].includes(row.difficulty)) {
        errors.push('difficulty must be easy/medium/hard');
      }
      if (category === 'pyq' && row.pyq_year && !/^\d{4}$/.test(row.pyq_year)) {
        errors.push('pyq_year must be a 4-digit year');
      }
      const valid = errors.length === 0;
      if (!valid) errorCount++;
      parsed.push({ rowIndex: i, data: row, errors, valid });
    }
    if (parsed.length > 0 && errorCount / parsed.length > 0.1) {
      setRows(parsed.map(r => ({ ...r, errors: [...r.errors, 'Batch rejected: >10% rows malformed'], valid: false })));
    } else {
      setRows(parsed);
    }
  }, [meta.required, category]);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (file.name.endsWith('.csv')) {
        parseCSV(text);
      } else {
        parseCSV(text);
      }
    };
    reader.readAsText(file);
  }, [parseCSV]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleUpload = async () => {
    if (!course) {
      setResult({ success: 0, failed: 1 });
      return;
    }
    setUploading(true);
    setResult(null);
    try {
      const supabase = createClient();
      const validRows = rows.filter(r => r.valid);
      let success = 0;
      let failed = 0;
      for (const row of validRows) {
        const insertData: Record<string, unknown> = {
          question: row.data.question_text,
          option_a: row.data.option_a,
          option_b: row.data.option_b,
          option_c: row.data.option_c,
          option_d: row.data.option_d,
          correct: row.data.correct_option.toUpperCase(),
          explanation: row.data.explanation ?? '',
          difficulty: row.data.difficulty ?? 'medium',
          topic: row.data.topic ?? '',
          archived: false,
          is_pyq: category === 'pyq',
          pyq_year: category === 'pyq' ? (row.data.pyq_year ?? null) : null,
          is_rapid_fire: category === 'rapid_fire',
          subject_id: row.data.subject_id ?? null,
          exam_id: course,
        };
        const { error } = await supabase.from('questions').insert(insertData);
        if (error) failed++;
        else success++;
      }
      setResult({ success, failed });
      if (failed === 0) setRows([]);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-bold text-ink mb-2 block">Course</label>
        <select
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-ink text-sm"
        >
          {COURSE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(Object.entries(CATEGORY_META) as [QuestionCategory, typeof meta][]).map(([key, m]) => (
          <button
            key={key}
            onClick={() => { setCategory(key); setRows([]); setResult(null); }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${category === key ? 'bg-primary text-white' : 'bg-surface2 text-ink-muted hover:text-ink'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-border'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <FileSpreadsheet size={48} className="mx-auto mb-4 text-ink-muted" />
        <h3 className="text-lg font-bold text-ink mb-2">Drop CSV file here</h3>
        <p className="text-sm text-ink-muted mb-1">{meta.label} upload</p>
        <p className="text-xs text-ink-muted mb-4">Columns: {meta.description}</p>
        <input
          type="file"
          accept=".csv,.txt"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          className="hidden"
          id="csv-upload"
        />
        <Button variant="secondary" onClick={() => document.getElementById('csv-upload')?.click()}>
          <Upload size={18} />
          Browse Files
        </Button>
      </div>

      {rows.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-ink mb-4">Preview ({rows.filter(r => r.valid).length} valid / {rows.length} total)</h3>
          <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
            {rows.map((row) => (
              <div key={row.rowIndex} className={`p-3 rounded-xl text-sm border ${row.valid ? 'border-border' : 'border-danger/30 bg-danger/5'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-ink">Row {row.rowIndex}</span>
                  {row.valid ? (
                    <CheckCircle2 size={16} className="text-success" />
                  ) : (
                    <AlertCircle size={16} className="text-danger" />
                  )}
                </div>
                <p className="text-ink-muted truncate">{row.data.question_text}</p>
                {row.errors.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {row.errors.map((err, i) => (
                      <p key={i} className="text-[10px] text-danger">{err}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <Button onClick={handleUpload} className="w-full" disabled={rows.filter(r => r.valid).length === 0 || uploading}>
            <Upload size={18} />
            Upload {rows.filter(r => r.valid).length} Valid Questions
          </Button>
        </Card>
      )}

      {result && !course && (
        <Card className="p-4 border-danger/30">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-danger" />
            <span className="text-sm text-ink">Please select a course before uploading.</span>
          </div>
        </Card>
      )}

      {result && course && (
        <Card className={`p-4 ${result.failed > 0 ? 'border-danger/30' : 'border-success/30'}`}>
          <div className="flex items-center gap-3">
            {result.failed > 0 ? <AlertCircle size={20} className="text-danger" /> : <CheckCircle2 size={20} className="text-success" />}
            <span className="text-sm text-ink">{result.success} uploaded, {result.failed} failed</span>
          </div>
        </Card>
      )}
    </div>
  );
}
