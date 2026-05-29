'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Archive, Edit3, Copy } from 'lucide-react';

export default function AdminQuestionBankPage() {
  const [questions, setQuestions] = useState<Record<string, unknown>[]>([]);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [duplicates, setDuplicates] = useState<{ content_hash: string; count: number; ids: string[] }[]>([]);
  const [showDuplicates, setShowDuplicates] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/questions');
        const data = await res.json();
        if (!cancelled) setQuestions(data.questions ?? []);
      } catch (err) {
        if (!cancelled) console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [refreshKey]);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/questions');
      const data = await res.json();
      if (!data.questions?.length) return;
      const hashCounts = new Map<string, number>();
      const hashIds = new Map<string, string[]>();
      for (const row of data.questions as { content_hash: string; id: string }[]) {
        const h = row.content_hash;
        if (!h) continue;
        hashCounts.set(h, (hashCounts.get(h) ?? 0) + 1);
        const ids = hashIds.get(h) ?? [];
        ids.push(row.id);
        hashIds.set(h, ids);
      }
      const dupes: { content_hash: string; count: number; ids: string[] }[] = [];
      for (const [hash, count] of hashCounts) {
        if (count > 1) dupes.push({ content_hash: hash, count, ids: hashIds.get(hash) ?? [] });
      }
      setDuplicates(dupes);
    })();
  }, [refreshKey]);

  const handleArchive = async (id: string) => {
    await fetch(`/api/admin/questions?id=${id}`, { method: 'DELETE' });
    setRefreshKey(k => k + 1);
  };

  const handleEditSave = async (id: string) => {
    await fetch(`/api/admin/questions?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setEditingId(null);
    setRefreshKey(k => k + 1);
  };

  const startEdit = (q: Record<string, unknown>) => {
    setEditingId(q.id as string);
    setEditForm({
      question: q.question as string,
      option_a: q.option_a as string,
      option_b: q.option_b as string,
      option_c: q.option_c as string,
      option_d: q.option_d as string,
      explanation: (q.explanation as string) ?? '',
      difficulty: (q.difficulty as string) ?? 'medium',
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h1 className="text-3xl font-bold text-ink">Question Bank</h1>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
          <Input
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-36">
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </Select>
        <Button
          variant={showDuplicates ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setShowDuplicates(!showDuplicates)}
          className="whitespace-nowrap"
        >
          <Copy size={14} />
          Duplicates ({duplicates.length})
        </Button>
      </div>

      {showDuplicates && duplicates.length > 0 && (
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-sm text-ink">Potential Duplicates</h3>
          {duplicates.map((d) => (
            <div key={d.content_hash} className="flex items-center justify-between p-2 bg-surface2 rounded-lg text-sm">
              <span className="text-ink-muted">Hash: <code className="text-ink">{d.content_hash.slice(0, 12)}...</code></span>
              <span className="text-warning font-medium">{d.count} copies</span>
            </div>
          ))}
        </Card>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : questions.length === 0 ? (
          <p className="text-center text-ink-muted italic py-12">No questions found</p>
        ) : (
          questions.map((q) => (
            <Card key={q.id as string} className="p-5">
              {editingId === q.id ? (
                <div className="space-y-3">
                  <textarea
                    className="w-full px-4 py-3 bg-surface2 border border-border rounded-xl text-ink text-sm"
                    value={editForm.question}
                    onChange={(e) => setEditForm(f => ({ ...f, question: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {['A', 'B', 'C', 'D'].map(opt => (
                      <div key={opt} className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-ink-muted">Option {opt}</span>
                        <Input
                          value={editForm[`option_${opt.toLowerCase()}`]}
                          onChange={(e) => setEditForm(f => ({ ...f, [`option_${opt.toLowerCase()}`]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleEditSave(q.id as string)}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm font-medium text-ink flex-1">{q.question as string}</p>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <Badge variant={q.difficulty === 'hard' ? 'danger' : q.difficulty === 'medium' ? 'warning' : 'success'}>
                        {q.difficulty as string}
                      </Badge>
                      <button onClick={() => startEdit(q)} className="text-ink-muted hover:text-primary">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleArchive(q.id as string)} className="text-ink-muted hover:text-danger">
                        <Archive size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {['A', 'B', 'C', 'D'].map(opt => (
                      <div key={opt} className={`p-2 rounded-lg text-xs ${q.correct === opt ? 'bg-success/10 text-success font-bold' : 'bg-surface2 text-ink-muted'}`}>
                        {opt}: {(q as Record<string, unknown>)[`option_${opt.toLowerCase()}`] as string}
                      </div>
                    ))}
                  </div>
                  {q.explanation != null ? (
                    <p className="text-xs text-ink-muted mt-2 italic">{String(q.explanation)}</p>
                  ) : null}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </motion.div>
  );
}
