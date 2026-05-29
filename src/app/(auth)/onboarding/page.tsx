'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, ChevronLeft, ChevronRight, Check, Camera } from 'lucide-react';

const WB_DISTRICTS = [
  'Alipurduar', 'Bankura', 'Birbhum', 'Cooch Behar', 'Dakshin Dinajpur',
  'Darjeeling', 'Hooghly', 'Howrah', 'Jalpaiguri', 'Jhargram',
  'Kalimpong', 'Kolkata', 'Malda', 'Murshidabad', 'Nadia',
  'North 24 Parganas', 'Paschim Bardhaman', 'Paschim Medinipur',
  'Purba Bardhaman', 'Purba Medinipur', 'Purulia', 'South 24 Parganas',
  'Uttar Dinajpur',
];

const EXAM_CHIPS = [
  { id: 'JENPAS_UG_P1', label: 'JENPAS (UG) — Paper I' },
  { id: 'JENPAS_UG_P2', label: 'JENPAS (UG) — Paper II (BHA)' },
  { id: 'ANM_GNM', label: 'ANM & GNM' },
  { id: 'JEPBN', label: 'JEPBN 2026' },
  { id: 'JEMSCN', label: 'JEMScN 2026' },
  { id: 'JEMAS', label: 'JEMAS (PG)' },
];

const JEMAS_SUB_COURSES = [
  'MHA', 'MPH', 'M.Sc. MLT', 'MAN', 'M.Sc. MBT',
  'M.Phil CP', 'M.Phil PSW',
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [targetExams, setTargetExams] = useState<string[]>([]);
  const [jemasSubCourse, setJemasSubCourse] = useState('');
  const [currentStage, setCurrentStage] = useState<'Student' | 'Appeared' | 'Working Nurse'>('Student');
  const [district, setDistrict] = useState('');
  const [institution, setInstitution] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const toggleExam = (id: string) => {
    setTargetExams((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
    if (id !== 'JEMAS') setJemasSubCourse('');
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const profileData: Record<string, unknown> = {
        displayName,
        photoURL: photoURL || null,
        targetExams: targetExams.includes('JEMAS') && jemasSubCourse
          ? targetExams.filter(e => e !== 'JEMAS').concat(`JEMAS_${jemasSubCourse.replace(/[\s.]/g, '_').toUpperCase()}`)
          : targetExams,
        jemasSubCourse: targetExams.includes('JEMAS') ? jemasSubCourse : '',
        currentStage,
        district,
        institution: institution || '',
        profileCompletePct: 100,
      };

      if (user) {
        await supabase.from('profiles').update(profileData).eq('id', user.id);
        setUser({ ...user, ...profileData } as typeof user);
      }
      router.push('/dashboard');
    } catch (err) {
      console.error('Onboarding failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-ink">Complete Your Profile</h1>
          <p className="text-sm text-ink-muted mt-1">Step {step} of 3</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-8 h-2 rounded-full transition-all ${s === step ? 'bg-primary w-12' : s < step ? 'bg-primary/40' : 'bg-surface2'}`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-ink">Tell us about yourself</h2>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                placeholder="Priya Das"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Profile Photo (optional)</Label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-surface2 flex items-center justify-center text-ink-muted">
                  <Camera size={24} />
                </div>
                <Button variant="secondary" size="sm" onClick={() => setPhotoURL('https://api.dicebear.com/9.x/avataaars/svg?seed=' + displayName)}>
                  Generate Avatar
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!displayName.trim()}>
                Next <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-ink">Select your exams</h2>
            <p className="text-sm text-ink-muted">Choose the exams you are preparing for</p>
            <div className="flex flex-wrap gap-2">
              {EXAM_CHIPS.map((exam) => (
                <button
                  key={exam.id}
                  onClick={() => toggleExam(exam.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                    targetExams.includes(exam.id)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface text-ink-muted border-border hover:border-primary/50'
                  }`}
                >
                  {exam.label}
                </button>
              ))}
            </div>
            {targetExams.includes('JEMAS') && (
              <div className="space-y-2">
                <Label>Select JEMAS PG Sub-Course</Label>
                <div className="flex flex-wrap gap-2">
                  {JEMAS_SUB_COURSES.map((course) => (
                    <button
                      key={course}
                      onClick={() => setJemasSubCourse(course)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        jemasSubCourse === course
                          ? 'bg-accent text-white border-accent'
                          : 'bg-surface text-ink-muted border-border'
                      }`}
                    >
                      {course}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ChevronLeft size={18} /> Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={targetExams.length === 0}>
                Next <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-ink">Your background</h2>
            <div className="space-y-2">
              <Label>Current Stage</Label>
              <div className="flex gap-2">
                {(['Student', 'Appeared', 'Working Nurse'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setCurrentStage(s)}
                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
                      currentStage === s
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface text-ink-muted border-border'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>District</Label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-ink text-sm"
              >
                <option value="">Select district</option>
                {WB_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Institution (optional)</Label>
              <Input
                placeholder="Your college or institution"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ChevronLeft size={18} /> Back
              </Button>
              <Button onClick={handleFinish} disabled={loading || !district}>
                <Check size={18} />
                {loading ? 'Saving...' : 'Complete Profile'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
