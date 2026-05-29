const MOCK_USER_ID = 'mock-user-001';
const MOCK_EXAMS = [
  { id: 'exam-jenpas-ug-p1', code: 'JENPAS_UG_P1', name: 'JENPAS (UG) — Paper I' },
  { id: 'exam-jenpas-ug-p2', code: 'JENPAS_UG_P2', name: 'JENPAS (UG) — Paper II (BHA)' },
  { id: 'exam-anm-gnm', code: 'ANM_GNM', name: 'ANM & GNM' },
  { id: 'exam-jepbn', code: 'JEPBN', name: 'JEPBN 2026' },
  { id: 'exam-jemscn', code: 'JEMSCN', name: 'JEMScN 2026' },
  { id: 'exam-jemas-mha', code: 'JEMAS_MHA', name: 'JEMAS PG — MHA' },
  { id: 'exam-jemas-mph', code: 'JEMAS_MPH', name: 'JEMAS PG — MPH' },
  { id: 'exam-jemas-mlt', code: 'JEMAS_MLT', name: 'JEMAS PG — M.Sc. MLT' },
  { id: 'exam-jemas-man', code: 'JEMAS_MAN', name: 'JEMAS PG — MAN' },
  { id: 'exam-jemas-mbt', code: 'JEMAS_MBT', name: 'JEMAS PG — M.Sc. MBT' },
];

const MOCK_QUESTIONS = [
  { id: 'q-1', examId: 'JENPAS_UG_P1', subject: 'Biology', topic: 'Human Physiology', difficulty: 'Easy', category: 'I', questionText: 'The enzyme pepsin is secreted by:', options: { A: 'Chief cells', B: 'Parietal cells', C: 'Mucous cells', D: 'G cells' }, correctAnswers: ['A'], explanation: 'Pepsin is secreted as pepsinogen by chief cells.' },
  { id: 'q-2', examId: 'JENPAS_UG_P1', subject: 'Physics', topic: 'Thermodynamics', difficulty: 'Medium', category: 'II', questionText: 'Which of the following are correct about ideal gases?', options: { A: 'PV = nRT holds', B: 'Molecules have zero volume', C: 'Intermolecular forces are zero', D: 'Gas can be liquefied' }, correctAnswers: ['A','B','C'], explanation: 'Ideal gases obey PV=nRT with zero molecular volume and no intermolecular forces.' },
  { id: 'q-3', examId: 'ANM_GNM', subject: 'Life Science', topic: 'Inheritance & Genetics', difficulty: 'Easy', category: 'I', questionText: 'Law of segregation was proposed by:', options: { A: 'Darwin', B: 'Mendel', C: 'Morgan', D: 'De Vries' }, correctAnswers: ['B'], explanation: 'Mendel proposed the law of segregation.' },
  { id: 'q-4', examId: 'JENPAS_UG_P1', subject: 'Biology', topic: 'Cell Biology', difficulty: 'Easy', category: 'I', questionText: 'Which organelle is known as the powerhouse of the cell?', options: { A: 'Nucleus', B: 'Mitochondria', C: 'Ribosome', D: 'Golgi body' }, correctAnswers: ['B'], explanation: 'Mitochondria produce ATP through cellular respiration.' },
  { id: 'q-5', examId: 'JENPAS_UG_P1', subject: 'Biology', topic: 'Cell Biology', difficulty: 'Easy', category: 'I', questionText: 'What is the basic unit of life?', options: { A: 'Atom', B: 'Molecule', C: 'Cell', D: 'Tissue' }, correctAnswers: ['C'], explanation: 'The cell is the fundamental unit of all living organisms.' },
  { id: 'q-6', examId: 'JENPAS_UG_P1', subject: 'Physics', topic: 'Mechanics', difficulty: 'Easy', category: 'I', questionText: 'What is the SI unit of force?', options: { A: 'Joule', B: 'Newton', C: 'Watt', D: 'Pascal' }, correctAnswers: ['B'], explanation: 'Newton (N) is the SI unit of force.' },
  { id: 'q-7', examId: 'JENPAS_UG_P1', subject: 'Physics', topic: 'Mechanics', difficulty: 'Easy', category: 'I', questionText: 'Which law states that every action has an equal and opposite reaction?', options: { A: "Newton's First Law", B: "Newton's Second Law", C: "Newton's Third Law", D: 'Law of Gravitation' }, correctAnswers: ['C'], explanation: "Newton's Third Law: For every action, there is an equal and opposite reaction." },
  { id: 'q-8', examId: 'JENPAS_UG_P1', subject: 'Chemistry', topic: 'Periodic Table', difficulty: 'Easy', category: 'I', questionText: 'What is the chemical symbol for gold?', options: { A: 'Go', B: 'Gd', C: 'Au', D: 'Ag' }, correctAnswers: ['C'], explanation: 'Au comes from Latin "aurum" meaning gold.' },
  { id: 'q-9', examId: 'JENPAS_UG_P1', subject: 'Chemistry', topic: 'Acids and Bases', difficulty: 'Easy', category: 'I', questionText: 'The pH of a neutral solution is:', options: { A: '0', B: '7', C: '14', D: '1' }, correctAnswers: ['B'], explanation: 'A pH of 7 is neutral at 25°C.' },
  { id: 'q-10', examId: 'JENPAS_UG_P1', subject: 'Chemistry', topic: 'Chemical Bonding', difficulty: 'Medium', category: 'I', questionText: 'Which bond is formed by sharing of electrons?', options: { A: 'Ionic bond', B: 'Covalent bond', C: 'Metallic bond', D: 'Hydrogen bond' }, correctAnswers: ['B'], explanation: 'Covalent bonds form when atoms share electron pairs.' },
  { id: 'q-11', examId: 'ANM_GNM', subject: 'Life Science', topic: 'Physiology', difficulty: 'Easy', category: 'I', questionText: 'Normal resting heart rate for adults is:', options: { A: '40-50 bpm', B: '60-100 bpm', C: '100-120 bpm', D: '120-140 bpm' }, correctAnswers: ['B'], explanation: 'Normal resting heart rate is 60-100 bpm.' },
  { id: 'q-12', examId: 'ANM_GNM', subject: 'Life Science', topic: 'Health & Disease', difficulty: 'Medium', category: 'I', questionText: 'Which organism causes tuberculosis?', options: { A: 'Streptococcus', B: 'Mycobacterium tuberculosis', C: 'E. coli', D: 'Staphylococcus' }, correctAnswers: ['B'], explanation: 'Mycobacterium tuberculosis causes TB.' },
];

interface MockUser {
  password: string;
  isAdmin: boolean;
  id: string;
  email: string;
  displayName: string;
}

const CREDENTIALS: Record<string, MockUser> = {
  'admin@wbnursing.app': { password: 'admin123', isAdmin: true, id: 'admin-001', email: 'admin@wbnursing.app', displayName: 'Admin' },
  'demo@wbnursing.app': { password: 'demo123', isAdmin: false, id: MOCK_USER_ID, email: 'demo@wbnursing.app', displayName: 'Demo User' },
};

function makeMockProfile(isAdmin: boolean, overrides?: Record<string, unknown>) {
  return {
    id: isAdmin ? 'admin-001' : MOCK_USER_ID,
    uid: isAdmin ? 'admin-001' : MOCK_USER_ID,
    displayName: isAdmin ? 'Admin' : 'Demo User',
    email: isAdmin ? 'admin@wbnursing.app' : 'demo@wbnursing.app',
    photoURL: null,
    phone: '',
    targetExams: isAdmin ? ['JENPAS_UG_P1'] : ['JENPAS_UG_P1', 'ANM_GNM'],
    jemasSubCourse: '',
    currentStage: isAdmin ? 'Working Nurse' : 'Student',
    institution: isAdmin ? '' : 'Demo College',
    district: 'Kolkata',
    joinedAt: '2025-01-01T00:00:00Z',
    totalMarksEarned: isAdmin ? 9999 : 450,
    totalQuestionsAttempted: isAdmin ? 5000 : 120,
    totalCorrect: isAdmin ? 4000 : 85,
    totalWrong: isAdmin ? 800 : 25,
    totalSkipped: isAdmin ? 200 : 10,
    bestMockScore: isAdmin ? 98 : 76,
    rapidFireUnlockedTier: isAdmin ? 5 : 2,
    streakDays: isAdmin ? 30 : 7,
    lastLoginAt: new Date().toISOString(),
    profileCompletePct: 100,
    isAdmin,
    ...overrides,
  };
}

function getMockQuizzes() {
  const now = new Date().toISOString();
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString();
  return [
    { id: 'quiz-mock-1', title: 'Weekly Mock — JENPAS UG Paper I — Week 21', exam_id: 'exam-jenpas-ug-p1', type: 'weekly_mock', duration_seconds: 7200, question_count: 10, start_time: now, end_time: nextWeek, maxMarks: 115, isAuto: true },
    { id: 'quiz-mock-2', title: 'Biology Practice Test', exam_id: 'exam-jenpas-ug-p1', type: 'mock', duration_seconds: 1800, question_count: 10, start_time: null, end_time: null, maxMarks: 25, isAuto: false },
    { id: 'quiz-mock-3', title: 'ANM/GNM Weekly Mock — Week 21', exam_id: 'exam-anm-gnm', type: 'weekly_mock', duration_seconds: 7200, question_count: 10, start_time: now, end_time: nextWeek, maxMarks: 115, isAuto: true },
  ];
}

function getMockNotifications() {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  return [
    { id: 'notif-1', title: 'New Weekly Mock Tests Live!', body: 'This week\'s mock tests are ready. Attempt now for full leaderboard credit.', targetExams: ['all'], type: 'mock_test', createdAt: now, readBy: [] },
    { id: 'notif-2', title: 'Result Published', body: 'Your JENPAS UG Paper I mock test result is available.', targetExams: ['JENPAS_UG_P1'], type: 'result', createdAt: yesterday, readBy: [] },
  ];
}

let mockDbStore: Record<string, unknown[]> = {};

function resetStore() {
  mockDbStore = {};
}

type QueryResult<T = unknown> = { data: T | null; error: null | { message: string; details: string; hint: string; code: string } };

class MockQueryBuilder {
  private table: string;
  private filters: { col: string; op: string; val: unknown }[] = [];
  private orderBy: { col: string; dir: 'asc' | 'desc' } | null = null;
  private limitCount: number | null = null;
  private isMaybeSingle = false;
  private selectRaw: string | null = null;
  private inserted: unknown[] | null = null;
  private updated: Record<string, unknown> | null = null;
  private upserted: unknown[] | null = null;
  private upsertOptions: Record<string, unknown> | null = null;
  private countMode: { count: 'exact' | 'planned' | 'estimated'; head: boolean } | null = null;

  constructor(table: string) { this.table = table; }

  select(fields?: string | Record<string, unknown>): this {
    if (typeof fields === 'object' && fields !== null) {
      this.countMode = fields as { count: 'exact' | 'planned' | 'estimated'; head: boolean };
    } else {
      this.selectRaw = fields ?? '*';
    }
    return this;
  }

  eq(col: string, val: unknown): this { this.filters.push({ col, op: 'eq', val }); return this; }
  neq(col: string, val: unknown): this { this.filters.push({ col, op: 'neq', val }); return this; }
  gt(col: string, val: unknown): this { this.filters.push({ col, op: 'gt', val }); return this; }
  gte(col: string, val: unknown): this { this.filters.push({ col, op: 'gte', val }); return this; }
  lt(col: string, val: unknown): this { this.filters.push({ col, op: 'lt', val }); return this; }
  lte(col: string, val: unknown): this { this.filters.push({ col, op: 'lte', val }); return this; }
  is(col: string, val: unknown): this { this.filters.push({ col, op: 'is', val }); return this; }
  not(col: string, _op: string, val: unknown): this { this.filters.push({ col, op: 'not', val }); return this; }
  in(col: string, vals: unknown[]): this { this.filters.push({ col, op: 'in', val: vals }); return this; }
  order(col: string, opts?: { ascending?: boolean }): this {
    this.orderBy = { col, dir: opts?.ascending !== false ? 'asc' : 'desc' };
    return this;
  }
  limit(n: number): this { this.limitCount = n; return this; }
  single(): this { this.limitCount = 1; return this; }
  maybeSingle(): this { this.limitCount = 1; this.isMaybeSingle = true; return this; }

  insert(rows: unknown[] | Record<string, unknown>): this {
    this.inserted = Array.isArray(rows) ? rows : [rows];
    return this;
  }
  update(obj: Record<string, unknown>): this { this.updated = obj; return this; }

  upsert(rows: unknown[], opts?: Record<string, unknown>): this {
    this.upserted = Array.isArray(rows) ? rows : [rows];
    this.upsertOptions = opts ?? null;
    return this;
  }

  private ensureStore(): void {
    if (!mockDbStore[this.table]) {
      mockDbStore[this.table] = [];
    }
  }

  private getTableData(): unknown[] {
    switch (this.table) {
      case 'exams': return MOCK_EXAMS;
      case 'profiles': {
        const stored = mockDbStore['profiles'];
        if (stored && stored.length > 0) return stored;
        return [makeMockProfile(false), makeMockProfile(true)];
      }
      case 'attempts': return mockDbStore['attempts'] ?? [];
      case 'questions': return MOCK_QUESTIONS;
      case 'quizzes': return getMockQuizzes();
      case 'notifications': return getMockNotifications();
      default: return mockDbStore[this.table] ?? [];
    }
  }

  private matchesFilters(item: Record<string, unknown>): boolean {
    for (const f of this.filters) {
      const val = item[f.col];
      switch (f.op) {
        case 'eq': if (val !== f.val) return false; break;
        case 'is': if (f.val === null && val !== null && val !== undefined) return false; if (f.val !== null && val !== f.val) return false; break;
        case 'not': if (val === f.val) return false; break;
        case 'neq': if (val === f.val) return false; break;
        case 'gt': if ((val as number) <= (f.val as number)) return false; break;
        case 'gte': if ((val as number) < (f.val as number)) return false; break;
        case 'lt': if ((val as number) >= (f.val as number)) return false; break;
        case 'lte': if ((val as number) > (f.val as number)) return false; break;
        case 'in': if (!Array.isArray(f.val) || !f.val.includes(val)) return false; break;
      }
    }
    return true;
  }

  private sortData(data: Record<string, unknown>[]): Record<string, unknown>[] {
    if (!this.orderBy) return data;
    return [...data].sort((a, b) => {
      const aVal = a[this.orderBy!.col] as number;
      const bVal = b[this.orderBy!.col] as number;
      if (this.orderBy!.dir === 'desc') return (bVal ?? 0) - (aVal ?? 0);
      return (aVal ?? 0) - (bVal ?? 0);
    });
  }

  then(resolve: (value: QueryResult) => void): void {
    if (this.inserted) {
      this.ensureStore();
      const existing = mockDbStore[this.table] as Record<string, unknown>[];
      const inserted = (this.inserted as Record<string, unknown>[]).map(row => ({
        ...row,
        id: row.id ?? `${this.table}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        created_at: row.created_at ?? new Date().toISOString(),
      }));
      existing.push(...inserted);
      resolve({ data: inserted, error: null });
      return;
    }
    if (this.updated) {
      resolve({ data: [this.updated], error: null });
      return;
    }
    if (this.upserted) {
      this.ensureStore();
      const existing = mockDbStore[this.table] as Record<string, unknown>[];
      for (const row of this.upserted as Record<string, unknown>[]) {
        const idx = existing.findIndex(e => (e as Record<string, unknown>).id === row.id);
        if (idx >= 0) {
          existing[idx] = { ...existing[idx], ...row };
        } else {
          existing.push({ ...row, id: row.id ?? `${this.table}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, created_at: new Date().toISOString() });
        }
      }
      const result = this.limitCount === 1 ? (this.upserted[0] ?? null) : this.upserted;
      resolve({ data: result as unknown as null, error: null });
      return;
    }
    const rawData = this.getTableData() as Record<string, unknown>[];
    let filtered = rawData.filter(item => this.matchesFilters(item));

    filtered = this.sortData(filtered);

    if (this.limitCount && this.limitCount === 1) {
      if (this.isMaybeSingle && filtered.length === 0) {
        resolve({ data: null, error: null });
        return;
      }
      resolve({ data: (filtered[0] ?? null) as unknown as null, error: filtered.length === 0 ? { message: 'No rows found', details: '', hint: '', code: 'PGRST116' } : null });
      return;
    }

    if (this.limitCount) {
      filtered = filtered.slice(0, this.limitCount);
    }

    resolve({ data: filtered as unknown as null, error: null });
  }

  catch(_onRejected: unknown): void {}
  finally(_onFinally: unknown): void {}
}

function makeAuthUser(email: string, isAdmin: boolean, id: string): Record<string, unknown> {
  return { id, email, user_metadata: { full_name: isAdmin ? 'Admin' : email.split('@')[0] } };
}

let mockUserIdCounter = 0;
const authChangeCallbacks: Array<(event: string, session: unknown) => void> = [];

function notifyAuthChange(event: string, email: string) {
  const session = email
    ? { user: { id: CREDENTIALS[email]?.id ?? MOCK_USER_ID, email }, access_token: 'mock-token' }
    : null;
  for (const cb of authChangeCallbacks) {
    try { cb(event, session); } catch { /* ignore */ }
  }
}

const mockAuth = {
  signInWithPassword: async (_: { email: string; password: string }): Promise<{ data: { user: Record<string, unknown> } | null; error: { message: string; status: number } | null }> => {
    const cred = CREDENTIALS[_.email];
    if (!cred || cred.password !== _.password) {
      return { data: null, error: { message: 'Invalid email or password', status: 401 } };
    }
    notifyAuthChange('SIGNED_IN', _.email);
    return { data: { user: makeAuthUser(cred.email, cred.isAdmin, cred.id) }, error: null };
  },
  signUp: async (_: { email: string; password: string; options?: Record<string, unknown> }): Promise<{ data: { user: Record<string, unknown> } | null; error: { message: string; status: number } | null }> => {
    if (CREDENTIALS[_.email]) {
      return { data: null, error: { message: 'An account with this email already exists.', status: 422 } };
    }
    mockUserIdCounter++;
    const uid = `mock-user-${Date.now()}-${mockUserIdCounter}`;
    const fullName = (_.options?.data as Record<string, unknown> ?? {}).full_name as string ?? _.email.split('@')[0];
    CREDENTIALS[_.email] = { password: _.password, isAdmin: false, id: uid, email: _.email, displayName: fullName };
    return { data: { user: makeAuthUser(_.email, false, uid) }, error: null };
  },
  signInWithOAuth: async (_: { provider: string; options?: { redirectTo?: string } }): Promise<{ data: { provider: string; url: string } | null; error: null }> => ({ data: { provider: _.provider, url: _.options?.redirectTo ?? '/' }, error: null }),
  getUser: async (): Promise<{ data: { user: { id: string; email: string; user_metadata: Record<string, string> } } | null; error: null }> => ({
    data: { user: { id: MOCK_USER_ID, email: 'demo@wbnursing.app', user_metadata: { full_name: 'Demo User' } } }, error: null,
  }),
  getSession: async (): Promise<{ data: { session: { access_token: string; user: { id: string; email: string } } } | null; error: null }> => ({
    data: { session: { access_token: 'mock-token', user: { id: MOCK_USER_ID, email: 'demo@wbnursing.app' } } }, error: null,
  }),
  exchangeCodeForSession: async (_code: string): Promise<{ data: { session: null }; error: null }> => ({ data: { session: null }, error: null }),
  signOut: async (): Promise<{ error: null }> => {
    notifyAuthChange('SIGNED_OUT', '');
    return { error: null };
  },
  onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
    authChangeCallbacks.push(callback);
    return {
      data: { subscription: { unsubscribe: () => { const i = authChangeCallbacks.indexOf(callback); if (i >= 0) authChangeCallbacks.splice(i, 1); } } },
    };
  },
};

const mockChannel = {
  on: (_event: string, _config: Record<string, unknown>, _callback: () => void) => mockChannel,
  subscribe: async (callback?: (status: string) => void) => { callback?.('SUBSCRIBED'); return mockChannel; },
  track: async (_metadata: Record<string, unknown>) => mockChannel,
  unsubscribe: () => {},
};

export function createMockClient() {
  resetStore();
  return {
    from: (table: string) => new MockQueryBuilder(table),
    auth: mockAuth,
    channel: (_name: string) => mockChannel,
    removeChannel: async (_ch: unknown) => {},
    rpc: async (_fn: string, _params?: Record<string, unknown>) => ({ data: null, error: null }),
  };
}
