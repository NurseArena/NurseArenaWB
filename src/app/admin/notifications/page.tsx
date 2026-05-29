'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Bell, Send, History } from 'lucide-react';
import { EXAMS } from '@/lib/exam-config';

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'exam' | 'user'>('all');
  const [targetExam, setTargetExam] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [notifHistory, setNotifHistory] = useState<{ title: string; body: string; createdAt: string }[]>([]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const supabase = createClient();
      const targetExams = targetType === 'all' ? ['all'] : targetType === 'exam' ? [targetExam] : [];
      const { error } = await supabase.from('notifications').insert({
        title: title.trim(),
        body: body.trim(),
        targetExams,
        type: 'announcement',
        createdAt: new Date().toISOString(),
        readBy: [],
      });
      if (error) throw error;
      setResult('Notification sent successfully!');
      setNotifHistory(prev => [{ title, body, createdAt: new Date().toISOString() }, ...prev]);
      setTitle('');
      setBody('');
    } catch (err) {
      setResult('Failed to send: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-ink">Send Notification</h1>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label>Target Audience</Label>
          <div className="flex gap-2">
            {(['all', 'exam', 'user'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTargetType(t)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                  targetType === t ? 'bg-primary text-white border-primary' : 'bg-surface text-ink-muted border-border'
                }`}
              >
                {t === 'all' ? 'All Users' : t === 'exam' ? 'By Exam' : 'Single User'}
              </button>
            ))}
          </div>
        </div>

        {targetType === 'exam' && (
          <div className="space-y-2">
            <Label>Select Exam</Label>
            <select
              value={targetExam}
              onChange={(e) => setTargetExam(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-ink text-sm"
            >
              <option value="">Select exam</option>
              {Object.entries(EXAMS).map(([code, exam]) => (
                <option key={code} value={code}>{exam.name}</option>
              ))}
            </select>
          </div>
        )}

        {targetType === 'user' && (
          <div className="space-y-2">
            <Label>User Email</Label>
            <Input
              placeholder="user@example.com"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            placeholder="Notification title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Body</Label>
          <textarea
            placeholder="Notification message"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-ink text-sm resize-none"
          />
        </div>

        <Button onClick={handleSend} disabled={sending || !title.trim() || !body.trim()} className="w-full">
          <Send size={18} />
          {sending ? 'Sending...' : 'Send Notification'}
        </Button>

        {result && (
          <div className={`p-3 rounded-xl text-sm ${result.startsWith('Failed') ? 'bg-danger/5 text-danger' : 'bg-success/5 text-success'}`}>
            {result}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
          <History size={18} /> Notification History
        </h2>
        {notifHistory.length === 0 ? (
          <p className="text-sm text-ink-muted">No notifications sent yet in this session.</p>
        ) : (
          <div className="space-y-3">
            {notifHistory.map((n, i) => (
              <div key={i} className="p-3 bg-surface2 rounded-xl">
                <p className="font-bold text-ink text-sm">{n.title}</p>
                <p className="text-xs text-ink-muted mt-0.5">{n.body}</p>
                <p className="text-[10px] text-ink-muted/60 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
