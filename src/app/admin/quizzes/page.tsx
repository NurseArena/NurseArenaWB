'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { CalendarPlus, RefreshCw, XCircle } from 'lucide-react';

const QUIZ_REQUIRED = 50;

export default function AdminQuizzesPage() {
  const supabase = createClient();
  const [title, setTitle] = useState('');
  const [examCode, setExamCode] = useState('JENPAS-UG');
  const [type, setType] = useState('quiz');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [pyqYear, setPyqYear] = useState('');
  const [durationMins, setDurationMins] = useState('30');
  const [questionCount, setQuestionCount] = useState('50');
  const [perQuestionSeconds, setPerQuestionSeconds] = useState('');
  const [scoringProfileId, setScoringProfileId] = useState('');
  const [liveAtDate, setLiveAtDate] = useState('');
  const [liveAtTime, setLiveAtTime] = useState('21:00');
  const [subjects, setSubjects] = useState<Record<string, unknown>[]>([]);
  const [topics, setTopics] = useState<Record<string, unknown>[]>([]);
  const [scoringProfiles, setScoringProfiles] = useState<Record<string, unknown>[]>([]);
  const [status, setStatus] = useState('');
  const [quizzes, setQuizzes] = useState<Record<string, unknown>[]>([]);
  const [poolMap, setPoolMap] = useState<Record<string, { available: number; reserved: number; used: number; quizzes_possible: number }>>({});
  const [editFailedId, setEditFailedId] = useState<string | null>(null);
  const [newLiveAtDate, setNewLiveAtDate] = useState('');

  const fetchPool = async () => {
    const { data: exams } = await supabase.from('exams').select('id, code');
    if (!exams) return;
    const examIds = exams.map((e: { id: string }) => e.id);
    const { data: questionCounts } = await supabase
      .from('questions')
      .select('exam_id, quiz_pool_status')
      .in('exam_id', examIds)
      .is('mock_test_id', null)
      .eq('is_pyq', false)
      .eq('archived', false);
    const counts = new Map<string, { available: number; reserved: number; used: number }>();
    for (const q of (questionCounts ?? []) as { exam_id: string; quiz_pool_status: string }[]) {
      let entry = counts.get(q.exam_id);
      if (!entry) { entry = { available: 0, reserved: 0, used: 0 }; counts.set(q.exam_id, entry); }
      if (q.quiz_pool_status === 'available') entry.available++;
      else if (q.quiz_pool_status === 'reserved') entry.reserved++;
      else if (q.quiz_pool_status === 'used') entry.used++;
    }
    const map: Record<string, { available: number; reserved: number; used: number; quizzes_possible: number }> = {};
    for (const exam of exams) {
      const c = counts.get(exam.id as string) ?? { available: 0, reserved: 0, used: 0 };
      map[exam.code as string] = { ...c, quizzes_possible: Math.floor(c.available / QUIZ_REQUIRED) };
    }
    setPoolMap(map);
  };

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from('subjects').select('id, name');
      if (s) setSubjects(s);
      const { data: sp } = await supabase.from('quiz_scoring_profiles').select('id, name, marks_correct, marks_wrong');
      if (sp) setScoringProfiles(sp);
    })();
    fetchPool();
    fetchQuizzes();
  }, []);

  useEffect(() => {
    if (!subjectId) { setTopics([]); return; }
    (async () => {
      const { data } = await supabase.from('topics').select('id, name').eq('subject_id', subjectId);
      if (data) setTopics(data);
    })();
  }, [subjectId]);

  const fetchQuizzes = async () => {
    const { data } = await supabase
      .from('quizzes')
      .select('id, title, type, exam_id, subject_id, topic_id, scoring_profile_id, duration_seconds, per_question_seconds, question_count, pyq_year, live_at, status, created_at, exam:exams(code, name)')
      .order('created_at', { ascending: false });
    if (data) setQuizzes(data as Record<string, unknown>[]);
  };

  const getExamIdForCode = async (code: string) => {
    const { data } = await supabase.from('exams').select('id').eq('code', code).single();
    return data?.id ?? null;
  };

  const reservePoolQuestions = async (quizId: string, examId: string) => {
    const { data: picked } = await supabase
      .from('questions')
      .select('id')
      .eq('exam_id', examId)
      .eq('quiz_pool_status', 'available')
      .is('mock_test_id', null)
      .eq('is_pyq', false)
      .eq('archived', false)
      .limit(QUIZ_REQUIRED);
    if (picked && picked.length >= QUIZ_REQUIRED) {
      const ids = picked.map((r: Record<string, unknown>) => r.id);
      const { error: updateErr } = await supabase.from('questions').update({ quiz_pool_status: 'reserved' }).in('id', ids);
      if (!updateErr) {
        await supabase.from('quiz_questions').insert(
          (ids as string[]).map((qid, i) => ({ quiz_id: quizId, question_id: qid, order_index: i }))
        );
      }
    }
  };

  const releasePoolQuestions = async (quizId: string) => {
    const { data: qq } = await supabase.from('quiz_questions').select('question_id').eq('quiz_id', quizId);
    if (qq?.length) {
      const ids = qq.map((r: Record<string, unknown>) => r.question_id);
      await supabase.from('questions').update({ quiz_pool_status: 'available' }).in('id', ids);
      await supabase.from('quiz_questions').delete().eq('quiz_id', quizId);
    }
  };

  const markPoolQuestionsUsed = async (quizId: string) => {
    const { data: qq } = await supabase.from('quiz_questions').select('question_id').eq('quiz_id', quizId);
    if (qq?.length) {
      const ids = qq.map((r: Record<string, unknown>) => r.question_id);
      await supabase.from('questions').update({ quiz_pool_status: 'used' }).in('id', ids);
    }
  };

  const handleCreate = async () => {
    setStatus('');
    try {
      const examId = await getExamIdForCode(examCode);
      if (!examId) throw new Error('Exam not found');

      const isQuizType = type === 'quiz';
      if (isQuizType) {
        const pool = poolMap[examCode];
        if (!pool || pool.available < QUIZ_REQUIRED) {
          setStatus(`Cannot schedule: only ${pool?.available ?? 0} available questions (need ${QUIZ_REQUIRED}). Upload more questions first.`);
          return;
        }
      }

      const liveAt = isQuizType && liveAtDate
        ? new Date(`${liveAtDate}T${liveAtTime}:00+05:30`).toISOString()
        : null;
      const catchupEndsAt = liveAt ? new Date(new Date(liveAt).getTime() + 7 * 86400000).toISOString() : null;

      const { data: quiz, error } = await supabase.from('quizzes').insert({
        exam_id: examId,
        title,
        type,
        subject_id: subjectId || null,
        topic_id: topicId || null,
        pyq_year: pyqYear ? parseInt(pyqYear) : null,
        question_count: parseInt(questionCount),
        duration_seconds: parseInt(durationMins) * 60,
        per_question_seconds: perQuestionSeconds ? parseInt(perQuestionSeconds) : null,
        scoring_profile_id: scoringProfileId || null,
        is_active: true,
        live_at: liveAt,
        catchup_ends_at: catchupEndsAt,
        live_status: liveAt ? 'scheduled' : null,
      }).select().single();

      if (error) throw error;

      if (isQuizType && quiz) {
        await reservePoolQuestions(quiz.id, examId);
        fetchPool();
      }

      setStatus(isQuizType ? `Quiz "${title}" scheduled with ${QUIZ_REQUIRED} questions reserved!` : `Quiz "${title}" created!`);
      setTitle('');
      fetchQuizzes();
    } catch (err: unknown) {
      setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleCancel = async (q: Record<string, unknown>) => {
    if (q.type === 'quiz' && (q.live_status === 'scheduled' || q.live_status === 'failed')) {
      await releasePoolQuestions(q.id as string);
    }
    await supabase.from('quizzes').update({ live_status: 'closed', is_active: false }).eq('id', q.id);
    fetchQuizzes();
    fetchPool();
  };

  const handleMarkUsed = async (q: Record<string, unknown>) => {
    if (q.type === 'quiz' && q.live_status === 'closed') {
      await markPoolQuestionsUsed(q.id as string);
      fetchPool();
    }
  };

  const handleReschedule = async () => {
    if (!newLiveAtDate || !editFailedId) return;
    const newLiveAt = new Date(`${newLiveAtDate}T21:00:00+05:30`).toISOString();
    const catchupEndsAt = new Date(new Date(newLiveAt).getTime() + 7 * 86400000).toISOString();
    await supabase.from('quizzes').update({
      live_status: 'scheduled',
      live_at: newLiveAt,
      catchup_ends_at: catchupEndsAt,
    }).eq('id', editFailedId);
    setEditFailedId(null);
    setNewLiveAtDate('');
    fetchQuizzes();
  };

  const isRapidFire = type === 'rapid_fire';
  const isPyq = type === 'pyq';
  const isScheduled = type === 'quiz';
  const pool = poolMap[examCode];
  const canSchedule = !isScheduled || (pool?.available ?? 0) >= QUIZ_REQUIRED;
  const afterPool = pool ? pool.available - QUIZ_REQUIRED : 0;

  const statusBadge = (s: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'default' | 'accent'> = {
      scheduled: 'warning',
      live: 'success',
      catchup: 'accent',
      closed: 'default',
      failed: 'danger',
    };
    return <Badge variant={variants[s] ?? 'default'}>{s}</Badge>;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold text-ink">Quiz Management</h1>

      <Card className={`p-6 space-y-4 ${!canSchedule && isScheduled ? 'border-danger/30' : ''}`}>
        <h2 className="font-semibold text-lg">Create New Quiz</h2>

        {isScheduled && pool && (
          <div className={`p-3 rounded-xl text-sm ${pool.available >= QUIZ_REQUIRED ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
            {pool.available >= QUIZ_REQUIRED
              ? `${examCode} — Available pool: ${pool.available} questions. After this quiz: ${afterPool} remaining (${Math.floor(afterPool / QUIZ_REQUIRED)} more quizzes possible).`
              : `Cannot schedule quiz for ${examCode} — only ${pool.available} questions available (need ${QUIZ_REQUIRED}). Upload more questions first.`}
          </div>
        )}

        {!pool && isScheduled && (
          <div className="p-3 rounded-xl text-sm bg-surface2 text-ink-muted">Loading pool data...</div>
        )}

        <div className="space-y-2">
          <Label>Quiz Title</Label>
          <Input placeholder="e.g. Weekly Quiz 5" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Exam</Label>
            <Select value={examCode} onChange={(e) => { setExamCode(e.target.value); setSubjectId(''); }}>
              <option value="JENPAS-UG">JENPAS-UG</option>
              <option value="JENPAS-PG">JENPAS-PG</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="quiz">Daily Quiz (50 Qs)</option>
              <option value="topicwise">Topic-wise</option>
              <option value="mock">Mock Test</option>
              <option value="rapid_fire">Rapid Fire</option>
              <option value="live">Live Quiz</option>
              <option value="pyq">PYQ</option>
              <option value="daily">Daily Challenge</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">All Subjects</option>
              {subjects.map((s) => (<option key={s.id as string} value={s.id as string}>{s.name as string}</option>))}
            </Select>
          </div>
          {subjectId && (
            <div className="space-y-2">
              <Label>Topic</Label>
              <Select value={topicId} onChange={(e) => setTopicId(e.target.value)}>
                <option value="">All Topics</option>
                {topics.map((t) => (<option key={t.id as string} value={t.id as string}>{t.name as string}</option>))}
              </Select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input type="number" value={durationMins} onChange={(e) => setDurationMins(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Question Count</Label>
            <Input type="number" value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} />
          </div>
        </div>

        {isRapidFire && (
          <div className="space-y-2">
            <Label>Per-Question Timer (seconds)</Label>
            <Input type="number" placeholder="e.g. 15" value={perQuestionSeconds} onChange={(e) => setPerQuestionSeconds(e.target.value)} />
          </div>
        )}

        {isPyq && (
          <div className="space-y-2">
            <Label>PYQ Year</Label>
            <Input type="number" placeholder="e.g. 2022" value={pyqYear} onChange={(e) => setPyqYear(e.target.value)} />
          </div>
        )}

        <div className="space-y-2">
          <Label>Scoring Profile</Label>
          <Select value={scoringProfileId} onChange={(e) => setScoringProfileId(e.target.value)}>
            <option value="">Default</option>
            {scoringProfiles.map((p) => (
              <option key={p.id as string} value={p.id as string}>{p.name as string} (+{p.marks_correct as string}/-{p.marks_wrong as string})</option>
            ))}
          </Select>
        </div>

        {isScheduled && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Live Date</Label>
                <Input type="date" value={liveAtDate} onChange={(e) => setLiveAtDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Live Time (IST)</Label>
                <Input type="time" value={liveAtTime} onChange={(e) => setLiveAtTime(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-ink-muted">Catchup ends 7 days after live date.</p>
          </>
        )}

        {status && (
          <p className={`text-sm ${status.startsWith('Error') || status.startsWith('Cannot') ? 'text-danger' : 'text-success'}`}>{status}</p>
        )}

        <Button onClick={handleCreate} className="w-full" disabled={!canSchedule && isScheduled}>
          <CalendarPlus size={18} />
          {isScheduled ? 'Schedule Quiz' : 'Create Quiz'}
        </Button>
      </Card>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg">All Quizzes</h2>
        {quizzes.length === 0 ? (
          <p className="text-sm text-ink-muted italic">No quizzes created yet.</p>
        ) : (
          quizzes.map((q) => (
            <Card key={q.id as string} className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{q.title as string}</p>
                  {statusBadge(q.live_status as string ?? (q.is_active ? 'scheduled' : 'closed'))}
                  {q.type === 'quiz' && q.live_status === 'failed' && (
                    <span className="text-xs text-danger font-medium">Insufficient pool</span>
                  )}
                </div>
                <p className="text-xs text-ink-muted mt-1">
                  {(q.exam as Record<string, unknown>)?.name as string ?? ''} &middot; {q.type as string}
                  &middot; {q.question_count as string} Qs &middot; {Math.round(Number(q.duration_seconds) / 60)} min
                  {q.live_at ? ` &middot; Live: ${new Date(q.live_at as string).toLocaleDateString()}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {(q.live_status === 'scheduled' || q.live_status === 'failed') && q.type === 'quiz' && (
                  <Button size="sm" variant="ghost" onClick={() => handleCancel(q)}><XCircle size={14} /> Cancel</Button>
                )}
                {q.live_status === 'failed' && (
                  <Button size="sm" variant="outline" onClick={() => { setEditFailedId(q.id as string); setNewLiveAtDate(''); }}>
                    <RefreshCw size={14} /> Fix &amp; Reschedule
                  </Button>
                )}
                {q.live_status === 'closed' && q.type === 'quiz' && (
                  <Button size="sm" variant="ghost" onClick={() => handleMarkUsed(q)}>Mark Used</Button>
                )}
              </div>
            </Card>
          ))
        )}

        {editFailedId && (
          <Card className="p-4 space-y-3 mt-3 border-primary/30">
            <h3 className="font-semibold text-sm">Reschedule Failed Quiz</h3>
            <p className="text-xs text-ink-muted">Upload more questions for this exam, then set a new live date.</p>
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-1">
                <Label>New Live Date</Label>
                <Input type="date" value={newLiveAtDate} onChange={(e) => setNewLiveAtDate(e.target.value)} />
              </div>
              <Button size="sm" onClick={handleReschedule} disabled={!newLiveAtDate}>
                <RefreshCw size={14} /> Reschedule
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditFailedId(null)}>Cancel</Button>
            </div>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
