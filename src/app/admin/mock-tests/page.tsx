'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, Send, Eye } from 'lucide-react';

export default function AdminMockTestsPage() {
  const [mockTests, setMockTests] = useState<Record<string, unknown>[]>([]);
  const [scoringProfiles, setScoringProfiles] = useState<Record<string, unknown>[]>([]);
  const [examCode, setExamCode] = useState('JENPAS-UG');
  const [title, setTitle] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [durationMins, setDurationMins] = useState('120');
  const [scoringProfileId, setScoringProfileId] = useState('');
  const [status, setStatus] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: mtData } = await supabase.from('mock_tests').select('id, title, exam_id, serial_number, duration_seconds, scoring_profile_id, status, published_at, created_at, exam:exams(name)').order('serial_number');
      if (mtData) setMockTests(mtData as Record<string, unknown>[]);
      const { data: spData } = await supabase.from('quiz_scoring_profiles').select('id, name, marks_correct, marks_wrong');
      if (spData) setScoringProfiles(spData as Record<string, unknown>[]);
    })();
  }, [refreshKey]);

  const handleCreate = async () => {
    setStatus('');
    try {
      const { data: exam } = await supabase.from('exams').select('id').eq('code', examCode).single();
      if (!exam) throw new Error('Exam not found');

      const { error } = await supabase.from('mock_tests').insert({
        exam_id: exam.id,
        title: title || `Mock Test ${serialNumber}`,
        serial_number: parseInt(serialNumber),
        duration_seconds: parseInt(durationMins) * 60,
        scoring_profile_id: scoringProfileId || null,
      });

      if (error) throw error;
      setStatus(`Mock Test created! Upload questions via CSV upload page.`);
      setTitle('');
      setSerialNumber('');
      setRefreshKey(k => k + 1);
    } catch (err: unknown) {
      setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handlePublish = async (id: string) => {
    await supabase.from('mock_tests').update({
      status: 'published',
      published_at: new Date().toISOString(),
    }).eq('id', id);
    setRefreshKey(k => k + 1);
  };

  const handleArchive = async (id: string) => {
    await supabase.from('mock_tests').update({ status: 'archived' }).eq('id', id);
    setRefreshKey(k => k + 1);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold text-ink">Mock Tests</h1>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-lg">Create New Mock Test</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Exam</label>
            <Select value={examCode} onChange={(e) => setExamCode(e.target.value)}>
              <option value="JENPAS-UG">JENPAS-UG</option>
              <option value="JENPAS-PG">JENPAS-PG</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Serial Number</label>
            <Input type="number" placeholder="e.g. 1" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Title (optional)</label>
            <Input placeholder="Mock Test 1" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Duration (minutes)</label>
            <Input type="number" value={durationMins} onChange={(e) => setDurationMins(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Scoring Profile</label>
            <Select value={scoringProfileId} onChange={(e) => setScoringProfileId(e.target.value)}>
              <option value="">Select profile</option>
              {scoringProfiles.map((p) => (
                <option key={p.id as string} value={p.id as string}>
                  {p.name as string} (+{p.marks_correct as string}/-{p.marks_wrong as string})
                </option>
              ))}
            </Select>
          </div>
        </div>
        <Button onClick={handleCreate}><Plus size={16} /> Create Mock Test</Button>
      </Card>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg">All Mock Tests</h2>
        {mockTests.length === 0 ? (
          <p className="text-sm text-ink-muted italic">No mock tests created yet.</p>
        ) : (
          mockTests.map((mt) => (
            <Card key={mt.id as string} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">{mt.title as string}</p>
                <p className="text-xs text-ink-muted">
                  {(mt.exam as Record<string, unknown>)?.name as string ?? ''} &middot; Serial #{mt.serial_number as string}
                  &middot; {Math.round(Number(mt.duration_seconds) / 60)} min
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={mt.status === 'published' ? 'success' : mt.status === 'draft' ? 'warning' : 'default'}>
                  {mt.status as string}
                </Badge>
                {mt.status === 'draft' && (
                  <Button size="sm" onClick={() => handlePublish(mt.id as string)}>
                    <Send size={14} /> Publish
                  </Button>
                )}
                {mt.status === 'published' && (
                  <Button size="sm" variant="ghost" onClick={() => handleArchive(mt.id as string)}>
                    Archive
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {status && (
        <p className={`text-sm ${status.startsWith('Error') ? 'text-danger' : 'text-success'}`}>{status}</p>
      )}
    </motion.div>
  );
}
