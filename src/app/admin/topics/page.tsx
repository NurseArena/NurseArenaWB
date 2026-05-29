'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Plus, Trash2, Merge } from 'lucide-react';

export default function AdminTopicsPage() {
  const [topics, setTopics] = useState<Record<string, unknown>[]>([]);
  const [subjects, setSubjects] = useState<Record<string, unknown>[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  const [mergeSourceId, setMergeSourceId] = useState('');
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [status, setStatus] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('subjects').select('id, name, exam_id');
      if (data) setSubjects(data as Record<string, unknown>[]);
    })();
  }, []);

  useEffect(() => {
    if (!selectedSubject) { setTopics([]); return; }
    (async () => {
      const { data } = await supabase.from('topics').select('id, name, subject_id, exam_id').eq('subject_id', selectedSubject).order('name');
      if (data) setTopics(data as Record<string, unknown>[]);
    })();
  }, [selectedSubject, refreshKey]);

  const handleAddTopic = async () => {
    if (!newTopicName.trim() || !selectedSubject) return;
    setStatus('');
    const subject = subjects.find(s => s.id === selectedSubject);
    if (!subject) { setStatus('Error: Subject not found'); return; }
    const { error } = await supabase.from('topics').insert({
      subject_id: selectedSubject,
      exam_id: subject.exam_id,
      name: newTopicName.trim(),
    });
    if (error) {
      setStatus(`Error: ${error.message}`);
    } else {
      setStatus(`Topic "${newTopicName}" created`);
      setNewTopicName('');
      setRefreshKey(k => k + 1);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    await supabase.from('topics').delete().eq('id', id);
    setRefreshKey(k => k + 1);
  };

  const handleMergeTopics = async () => {
    if (!mergeSourceId || !mergeTargetId || mergeSourceId === mergeTargetId) return;
    setStatus('');
    await supabase.from('questions').update({ topic_id: mergeTargetId }).eq('topic_id', mergeSourceId);
    await supabase.from('topics').delete().eq('id', mergeSourceId);
    setStatus('Topics merged successfully');
    setMergeSourceId('');
    setMergeTargetId('');
    setRefreshKey(k => k + 1);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold text-ink">Topic Management</h1>

      <Card className="p-6 space-y-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-ink">Subject</label>
            <Select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              <option value="">Select a subject</option>
              {subjects.map((s) => (
                <option key={s.id as string} value={s.id as string}>{s.name as string}</option>
              ))}
            </Select>
          </div>
        </div>

        {selectedSubject && (
          <>
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-ink">New Topic Name</label>
                <Input
                  placeholder="e.g. Bones of Upper Limb"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                />
              </div>
              <Button onClick={handleAddTopic} size="sm">
                <Plus size={16} />
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {topics.length === 0 ? (
                <p className="text-sm text-ink-muted italic">No topics yet for this subject.</p>
              ) : (
                topics.map((t) => (
                  <div key={t.id as string} className="flex items-center justify-between p-3 bg-surface2 rounded-lg">
                    <span className="text-sm font-medium text-ink">{t.name as string}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTopic(t.id as string)}
                      className="text-danger"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {topics.length >= 2 && (
              <>
                <hr className="border-border" />
                <h3 className="font-semibold text-sm text-ink">Merge Topics</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs text-ink-muted">Merge from</label>
                    <Select value={mergeSourceId} onChange={(e) => setMergeSourceId(e.target.value)}>
                      <option value="">Select source</option>
                      {topics.map((t) => (
                        <option key={t.id as string} value={t.id as string}>{t.name as string}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-ink-muted">Merge into</label>
                    <Select value={mergeTargetId} onChange={(e) => setMergeTargetId(e.target.value)}>
                      <option value="">Select target</option>
                      {topics.filter(t => t.id !== mergeSourceId).map((t) => (
                        <option key={t.id as string} value={t.id as string}>{t.name as string}</option>
                      ))}
                    </Select>
                  </div>
                </div>
                <Button onClick={handleMergeTopics} variant="outline" size="sm">
                  <Merge size={14} />
                  Merge Topics
                </Button>
              </>
            )}
          </>
        )}

        {status && (
          <p className={`text-sm ${status.startsWith('Error') ? 'text-danger' : 'text-success'}`}>{status}</p>
        )}
      </Card>
    </motion.div>
  );
}
