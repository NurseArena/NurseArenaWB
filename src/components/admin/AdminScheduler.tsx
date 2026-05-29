'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, AlertTriangle, X } from 'lucide-react';
import type { MockTestEvent, LiveQuizEvent } from '@/types/user';

export function AdminScheduler() {
  const [examCode, setExamCode] = useState('JENPAS-UG');
  const [mockTests, setMockTests] = useState<(MockTestEvent & { exams?: { name: string; code: string } })[]>([]);
  const [liveQuizzes, setLiveQuizzes] = useState<(LiveQuizEvent & { exams?: { name: string; code: string } })[]>([]);
  const [showMockForm, setShowMockForm] = useState(false);
  const [showLiveForm, setShowLiveForm] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [mockDate, setMockDate] = useState('');
  const [mockTime, setMockTime] = useState('');
  const [mockDuration, setMockDuration] = useState('120');
  const [mockMaxParticipants, setMockMaxParticipants] = useState('100');

  const [liveDate, setLiveDate] = useState('');
  const [liveTimezone, setLiveTimezone] = useState('Asia/Kolkata');
  const [liveDuration, setLiveDuration] = useState('30');

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('mock_test_events')
      .select('id, exam_id, title, description, status, scheduled_at, duration_min, scoring_profile_id, exams(name, code)')
      .order('scheduled_at', { ascending: true })
      .then((result: { data: unknown }) => {
        if (result.data) setMockTests(result.data as (MockTestEvent & { exams?: { name: string; code: string } })[]);
      });

    supabase
      .from('live_quiz_events')
      .select('id, exam_id, title, description, starts_at, ends_at, status, scoring_profile_id, exams(name, code)')
      .order('starts_at', { ascending: true })
      .then((result: { data: unknown }) => {
        if (result.data) setLiveQuizzes(result.data as (LiveQuizEvent & { exams?: { name: string; code: string } })[]);
      });
  }, [refreshKey]);

  const getWeekNumber = (date: Date) => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - startOfYear.getTime();
    return Math.ceil((diff / 86400000 + startOfYear.getDay() + 1) / 7);
  };

  const handleScheduleMock = async () => {
    setWarning(null);
    const supabase = createClient();
    const { data: exam } = await supabase.from('exams').select('id').eq('code', examCode).single();
    if (!exam) return;

    const scheduledAt = new Date(`${mockDate}T${mockTime}:00`).toISOString();
    const weekNumber = getWeekNumber(new Date(scheduledAt));
    const year = new Date(scheduledAt).getFullYear();

    const { data: existing } = await supabase
      .from('mock_test_events')
      .select('id, scheduled_at', { count: 'exact' })
      .eq('exam_id', exam.id)
      .eq('week_number', weekNumber)
      .eq('year', year);

    if ((existing?.length ?? 0) >= 2) {
      setWarning('Only 2 mock tests per week per exam allowed.');
      return;
    }

    const { data: liveEvents } = await supabase
      .from('live_quiz_events')
      .select('starts_at')
      .eq('exam_id', exam.id)
      .eq('status', 'scheduled');

    const hasConflict = (liveEvents ?? []).some((ev: { starts_at: string }) => {
      const liveStart = new Date(ev.starts_at).getTime();
      const mockStart = new Date(scheduledAt).getTime();
      return Math.abs(liveStart - mockStart) < 30 * 60000;
    });

    if (hasConflict) {
      setWarning('Warning: This mock test is within 30 minutes of a scheduled live quiz.');
    }

    await supabase.from('mock_test_events').insert({
      exam_id: exam.id,
      scheduled_at: scheduledAt,
      duration_min: parseInt(mockDuration),
      max_participants: parseInt(mockMaxParticipants),
      week_number: weekNumber,
      year: year,
    });

    setShowMockForm(false);
    setRefreshKey(k => k + 1);
  };

  const handleScheduleLive = async () => {
    const supabase = createClient();
    const { data: exam } = await supabase.from('exams').select('id').eq('code', examCode).single();
    if (!exam) return;

    const startsAt = new Date(`${liveDate}T21:00:00`).toISOString();

    await supabase.from('live_quiz_events').insert({
      exam_id: exam.id,
      starts_at: startsAt,
      timezone: liveTimezone,
      duration_min: parseInt(liveDuration),
      status: 'scheduled',
      current_q_index: 0,
    });

    setShowLiveForm(false);
    setRefreshKey(k => k + 1);
  };

  const handleCancelLiveQuiz = async (id: number) => {
    const supabase = createClient();
    await supabase.from('live_quiz_events').update({ status: 'cancelled' }).eq('id', id);
    setRefreshKey(k => k + 1);
  };

  const handleDeleteMockTest = async (id: number) => {
    const supabase = createClient();
    await supabase.from('mock_test_events').delete().eq('id', id);
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">Schedule Events</h2>
          <p className="text-sm text-ink-muted">Manage mock tests and live quiz slots</p>
        </div>
        <div className="flex gap-2">
          <Select value={examCode} onChange={(e) => setExamCode(e.target.value)} className="w-40">
            <option value="JENPAS-UG">JENPAS-UG</option>
            <option value="JENPAS-PG">JENPAS-PG</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-ink">Mock Tests</h3>
            <Button size="sm" onClick={() => setShowMockForm(true)}>+ Schedule</Button>
          </div>
          {showMockForm && (
            <div className="space-y-3 p-4 bg-surface2 rounded-xl">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Date</Label>
                  <Input type="date" value={mockDate} onChange={(e) => setMockDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Time</Label>
                  <Input type="time" value={mockTime} onChange={(e) => setMockTime(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Duration (min)</Label>
                  <Input type="number" value={mockDuration} onChange={(e) => setMockDuration(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Max Participants</Label>
                  <Input type="number" value={mockMaxParticipants} onChange={(e) => setMockMaxParticipants(e.target.value)} />
                </div>
              </div>
              {warning && (
                <div className="flex items-center gap-2 text-xs text-warning">
                  <AlertTriangle size={14} />
                  {warning}
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleScheduleMock}>Create</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowMockForm(false)}>Cancel</Button>
              </div>
            </div>
          )}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {mockTests.filter(m => m.exams?.code === examCode).map((mt) => (
              <div key={mt.id} className="flex items-center justify-between p-3 bg-surface2 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-ink">
                    <CalendarDays size={14} className="inline mr-1" />
                    {new Date(mt.scheduled_at).toLocaleDateString()} {new Date(mt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-ink-muted">{mt.duration_min} min · {mt.max_participants ?? '∞'} slots</p>
                </div>
                <button onClick={() => handleDeleteMockTest(Number(mt.id))} className="text-ink-muted hover:text-danger">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-ink">Live Quizzes (9 PM)</h3>
            <Button size="sm" onClick={() => setShowLiveForm(true)}>+ Schedule</Button>
          </div>
          {showLiveForm && (
            <div className="space-y-3 p-4 bg-surface2 rounded-xl">
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" value={liveDate} onChange={(e) => setLiveDate(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Timezone</Label>
                  <Select value={liveTimezone} onChange={(e) => setLiveTimezone(e.target.value)}>
                    <option value="Asia/Kolkata">Asia/Kolkata</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Duration (min) ≤60</Label>
                  <Input type="number" max={60} value={liveDuration} onChange={(e) => setLiveDuration(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleScheduleLive}>Create</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowLiveForm(false)}>Cancel</Button>
              </div>
            </div>
          )}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {liveQuizzes.filter(l => l.exams?.code === examCode).map((lq) => (
              <div key={lq.id} className="flex items-center justify-between p-3 bg-surface2 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-ink">
                    <Clock size={14} className="inline mr-1" />
                    {new Date(lq.starts_at).toLocaleDateString()} 9:00 PM
                  </p>
                  <p className="text-xs text-ink-muted">{lq.duration_min} min · {lq.timezone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={lq.status === 'live' ? 'danger' : lq.status === 'scheduled' ? 'warning' : 'default'}>{lq.status}</Badge>
                  {lq.status !== 'cancelled' && (
                    <button onClick={() => handleCancelLiveQuiz(Number(lq.id))} className="text-ink-muted hover:text-danger">
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
