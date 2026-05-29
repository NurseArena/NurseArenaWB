'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Search, RotateCcw } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('profiles')
          .select('id, name, displayName, email, is_admin, totalMarksEarned, totalCorrect, totalWrong, totalSkipped, bestMockScore, rapidFireUnlockedTier, targetExams, district, lastLoginAt, joinedAt')
          .limit(500);
        if (!cancelled) setUsers((data ?? []) as Record<string, unknown>[]);
      } catch (err) {
        if (!cancelled) console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const filtered = users.filter(u =>
    !search || ((u.displayName as string) ?? '').toLowerCase().includes(search.toLowerCase()) ||
    ((u.email as string) ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    const headers = ['displayName', 'email', 'totalMarksEarned', 'totalCorrect', 'totalWrong', 'targetExams', 'district', 'lastLoginAt'];
    const rows = filtered.map(u => [u.displayName, u.email, u.totalMarksEarned, u.totalCorrect, u.totalWrong, u.targetExams, u.district, u.lastLoginAt].map(v => `"${v ?? ''}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetScores = async (userId: string) => {
    if (!confirm('Reset all scores for this user?')) return;
    const supabase = createClient();
    await supabase.from('profiles').update({
      totalMarksEarned: 0,
      totalQuestionsAttempted: 0,
      totalCorrect: 0,
      totalWrong: 0,
      totalSkipped: 0,
      bestMockScore: 0,
      rapidFireUnlockedTier: 1,
    }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, totalMarksEarned: 0, totalCorrect: 0, totalWrong: 0, totalSkipped: 0, bestMockScore: 0, rapidFireUnlockedTier: 1 } : u));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">User Management</h1>
          <p className="text-sm text-ink-muted">{filtered.length} users</p>
        </div>
        <Button variant="secondary" onClick={exportCSV}>
          <Download size={18} />
          Export CSV
        </Button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-ink-muted italic py-12">No users found</p>
        ) : (
          filtered.map((u) => (
            <Card key={u.id as string} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {((u.displayName as string)?.[0] ?? '?').toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-ink">{u.displayName as string ?? 'Unknown'}</p>
                    <p className="text-xs text-ink-muted">{u.email as string ?? 'No email'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-ink-muted">{u.totalMarksEarned as number ?? 0} marks</span>
                      <span className="text-xs text-ink-muted">Correct: {u.totalCorrect as number ?? 0}</span>
                      <span className="text-xs text-ink-muted">Wrong: {u.totalWrong as number ?? 0}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleResetScores(u.id as string)} className="p-2 text-ink-muted hover:text-danger" title="Reset scores">
                    <RotateCcw size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </motion.div>
  );
}
