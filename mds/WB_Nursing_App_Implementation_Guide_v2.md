# West Bengal Nursing Exams — Web App Implementation Guide v2
**"Practice West Bengal Nursing Exams — Your One Stop Platform to Practice for West Bengal Nursing Exams"**
**Developers:** Aritra Banerjee & Arijit Dey | **© 2026 All Rights Reserved**

---

## TABLE OF CONTENTS

1. [Allowed Email Domains](#1-allowed-email-domains)
2. [User Profile Building](#2-user-profile-building)
3. [Marks-Based Scoring System (No XP)](#3-marks-based-scoring-system)
4. [Quiz Attempt Rules](#4-quiz-attempt-rules)
5. [Weekly Automatic Mock Test Upload](#5-weekly-automatic-mock-test-upload)
6. [Notification Panel Fix](#6-notification-panel-fix)
7. [Admin Panel — Exam, Subject & Topic Mapping + One-Click Upload](#7-admin-panel)
8. [Web Front Page Copy & Branding](#8-web-front-page-copy--branding)
9. [About Section](#9-about-section)
10. [Full Exam → Subject → Topic Mapping](#10-full-exam--subject--topic-mapping)
11. [Icon Guide (Minimal Set)](#11-icon-guide-minimal-set)
12. [Rapid Fire — Sequential Unlock & Answer Fix](#12-rapid-fire--sequential-unlock--answer-fix)
13. [Per-Exam Marking Scheme Reference](#13-per-exam-marking-scheme-reference)

---

## 1. Allowed Email Domains

Only allow sign-up with real, non-disposable email providers. Validate both on the frontend **and** server-side.

### Whitelist
```
gmail.com       googlemail.com
hotmail.com     hotmail.in      hotmail.co.uk
outlook.com     outlook.in
live.com        live.in
yahoo.com       yahoo.in        yahoo.co.in
rediffmail.com
icloud.com      me.com
protonmail.com  proton.me
```

### Frontend Validation
```javascript
const ALLOWED_DOMAINS = [
  "gmail.com","googlemail.com","hotmail.com","hotmail.in","hotmail.co.uk",
  "outlook.com","outlook.in","live.com","live.in",
  "yahoo.com","yahoo.in","yahoo.co.in",
  "rediffmail.com","icloud.com","me.com","protonmail.com","proton.me"
];

function isEmailAllowed(email) {
  const domain = email.split("@")[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
}

// In signup handler:
if (!isEmailAllowed(userEmail)) {
  showError("Please use a valid email (Gmail, Outlook, Yahoo, Rediffmail, etc.)");
  return;
}
```

### Backend / Firebase Cloud Function (Server-Side Guard)
```javascript
exports.blockDisposableEmails = functions.auth.user().onCreate(async (user) => {
  const domain = user.email?.split("@")[1]?.toLowerCase();
  const ALLOWED = [
    "gmail.com","googlemail.com","hotmail.com","hotmail.in","outlook.com",
    "outlook.in","live.com","yahoo.com","yahoo.in","yahoo.co.in",
    "rediffmail.com","icloud.com","me.com","protonmail.com","proton.me"
  ];
  if (!ALLOWED.includes(domain)) {
    await admin.auth().deleteUser(user.uid);
  }
});
```
> Google Sign-In is always allowed (uses gmail.com/googlemail.com).

---

## 2. User Profile Building

### Firestore Document: `users/{uid}`
```javascript
{
  uid: "abc123",
  displayName: "Priya Das",
  email: "priya@gmail.com",
  photoURL: null,               // Optional avatar upload
  phone: "",                    // Optional
  targetExams: ["JENPAS_UG"],   // Multi-select — see exam IDs in Section 10
  jemasSubCourse: "MHA",        // Only set if JEMAS_PG selected
  currentStage: "Student",      // Student | Appeared | Working Nurse
  institution: "XYZ College",   // Optional
  district: "Kolkata",          // West Bengal district dropdown
  joinedAt: Timestamp,
  // Marks-based stats (no XP)
  totalMarksEarned: 0,
  totalQuestionsAttempted: 0,
  totalCorrect: 0,
  totalWrong: 0,
  totalSkipped: 0,
  bestMockScore: 0,             // Best % across all mock tests
  // Rapid fire progress
  rapidFireUnlockedTier: 1,     // 1–5, unlocked by marks milestones
  // Streaks
  streakDays: 0,
  lastLoginAt: Timestamp,
  profileCompletePct: 0         // Computed field
}
```

### Onboarding Wizard (3 Steps)

**Step 1 — Identity**
- Full Name (required)
- Profile Photo (optional, skip allowed)

**Step 2 — Exam Selection**
- Multi-select chips:
  - JENPAS (UG) — Paper I
  - JENPAS (UG) — Paper II (BHA)
  - ANM & GNM
  - JEPBN 2026
  - JEMScN 2026
  - JEMAS (PG) → if selected, show second dropdown:
    - MHA
    - MPH
    - M.Sc. MLT
    - MAN
    - M.Sc. MBT
    - M.Phil CP (Clinical Psychology)
    - M.Phil PSW (Psychiatric Social Work)
    - MPT / MOT / MPO
    - Dip Diet / DHPE / DHS / FPM / MSLP

**Step 3 — Background**
- Current Stage: Student / Appeared / Working Nurse
- District (WB district list dropdown)
- Institution (optional text field)

### Profile Completion %
```javascript
function getProfileCompletion(user) {
  const fields = ['displayName','photoURL','phone','targetExams',
                  'currentStage','institution','district'];
  const filled = fields.filter(f => user[f] && String(user[f]).length > 0).length;
  return Math.round((filled / fields.length) * 100);
}
```

---

## 3. Marks-Based Scoring System

> **No XP anywhere in the app. Everything is driven by actual marks — matching the real exam scoring.**

### Core Scoring (stored per attempt)

```javascript
// quizAttempts/{uid}_{quizId}_{attemptN}
{
  uid: "abc123",
  quizId: "quiz_001",
  attemptNumber: 1,
  examId: "JENPAS_UG",
  startedAt: Timestamp,
  completedAt: Timestamp,
  totalMarks: 115,           // Max possible for this quiz
  marksEarned: 87.5,         // Actual score with negative marking
  percentage: 76.1,
  correct: 72,
  wrong: 10,
  skipped: 18,
  negativePenalty: -2.5,     // Total marks deducted
  categoryIAttempts: { correct: 60, wrong: 10, skip: 15 },
  categoryIIAttempts: { correct: 12, wrong: 0, partial: 3, skip: 3 },
  subjectBreakdown: {
    "Biology": { correct: 18, wrong: 2, marks: 22 },
    "Physics":  { correct: 17, wrong: 3, marks: 16.25 },
    ...
  },
  isLiveAttempt: true
}
```

### Marks Calculation Logic
```javascript
function calculateMarks(responses, questions) {
  let totalMarks = 0;

  responses.forEach((resp, i) => {
    const q = questions[i];

    if (q.category === "I") {
      // Single correct
      if (resp.selected === null) {
        // Skipped — 0
      } else if (resp.selected === q.correctAnswer) {
        totalMarks += 1.0;
      } else {
        totalMarks -= 0.25;
      }
    }

    if (q.category === "II") {
      // Multi-correct
      if (!resp.selected || resp.selected.length === 0) {
        // Skipped — 0
      } else {
        const hasWrongSelection = resp.selected.some(s => !q.correctAnswers.includes(s));
        if (hasWrongSelection) {
          // Any wrong selection = 0 (no penalty for Cat II)
          // totalMarks += 0
        } else {
          const partialRatio = resp.selected.length / q.correctAnswers.length;
          totalMarks += 2 * partialRatio;
        }
      }
    }
  });

  return Math.round(totalMarks * 100) / 100; // Round to 2 decimals
}
```

### Results Screen Display
```
┌──────────────────────────────────────┐
│  Quiz Complete!                      │
│                                      │
│  Score:    87.50 / 115  (76.1%)      │
│  Correct:  72    Wrong: 10  Skip: 18 │
│  Negative: -2.50 marks               │
│                                      │
│  Subject Breakdown:                  │
│  Biology  22/25  ████████░░  88%     │
│  Physics  16.25/25 ██████░░░░ 65%    │
│  Chemistry 21/25 ████████░░  84%     │
│  English  18/20  █████████░  90%     │
│  Health   10/20  █████░░░░░  50%     │
└──────────────────────────────────────┘
```

### Leaderboard — Ranked by Marks
```javascript
// Rank by: highest marksEarned → then highest percentage → then fewer wrong
const leaderboard = attempts
  .sort((a, b) => b.marksEarned - a.marksEarned
    || b.percentage - a.percentage
    || a.wrong - b.wrong);
```

### Rapid Fire Unlock — Based on Marks Milestones
Rapid fire tiers are unlocked by **cumulative marks earned** across all quiz attempts:

| Tier | Name | Marks Milestone | Timer |
|------|------|----------------|-------|
| 1 | Starter | 0 (free) | 15 sec |
| 2 | Speed Seeker | 200 marks total | 10 sec |
| 3 | Fast Track | 600 marks total | 7 sec |
| 4 | Lightning | 1,500 marks total | 5 sec |
| 5 | Storm | 3,500 marks total | 3 sec |

> Marks accumulate across all quiz attempts — including mock tests, practice sessions, and rapid fire.

---

## 4. Quiz Attempt Rules

### Live vs. Past Quiz
- Any quiz can be attempted at any time — live or after the window closes.
- **Live window:** standard marks apply, full score counts toward leaderboard.
- **Past window:** still fully attemptable, marks recorded to personal stats but **not counted on the live quiz leaderboard** — shown in personal history only.

```javascript
function isQuizLive(quiz) {
  const now = Date.now();
  return now >= quiz.startTime.toMillis() && now <= quiz.endTime.toMillis();
}

function saveAttempt(attempt, quizId) {
  attempt.isLiveAttempt = isQuizLive(getQuiz(quizId));
  // Save regardless — always goes to user history
  // Only updates leaderboard if isLiveAttempt === true
}
```

### Re-attempt Rules
- Students can re-attempt any quiz unlimited times.
- **Leaderboard** shows best score only.
- **Profile history** shows all attempts with timestamps.
- Second+ attempt on a live quiz counts for leaderboard if better than previous.

---

## 5. Weekly Automatic Mock Test Upload

### Firebase Scheduled Function (Monday 6:00 AM IST)
```javascript
// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");

exports.weeklyMockTest = functions.pubsub
  .schedule("every monday 06:00")
  .timeZone("Asia/Kolkata")
  .onRun(async () => {
    const db = admin.firestore();

    // All exam IDs including JEMAS sub-courses
    const examConfigs = [
      { examId: "JENPAS_UG_P1",     label: "JENPAS (UG) Paper I",          questionCount: 100, maxMarks: 115 },
      { examId: "JENPAS_UG_P2",     label: "JENPAS (UG) Paper II — BHA",   questionCount: 100, maxMarks: 115 },
      { examId: "ANM_GNM",          label: "ANM & GNM",                    questionCount: 100, maxMarks: 115 },
      { examId: "JEPBN",            label: "JEPBN 2026",                   questionCount: 100, maxMarks: 100 },
      { examId: "JEMSCN",           label: "JEMScN 2026",                  questionCount: 100, maxMarks: 100 },
      { examId: "JEMAS_MHA",        label: "JEMAS PG — MHA",               questionCount: 100, maxMarks: 100 },
      { examId: "JEMAS_MPH",        label: "JEMAS PG — MPH",               questionCount: 100, maxMarks: 100 },
      { examId: "JEMAS_MLT",        label: "JEMAS PG — M.Sc. MLT",         questionCount: 100, maxMarks: 100 },
      { examId: "JEMAS_MAN",        label: "JEMAS PG — MAN",               questionCount: 100, maxMarks: 100 },
      { examId: "JEMAS_MBT",        label: "JEMAS PG — M.Sc. MBT",         questionCount: 100, maxMarks: 100 },
      { examId: "JEMAS_MPHILCP",    label: "JEMAS PG — M.Phil CP",         questionCount: 100, maxMarks: 100 },
      { examId: "JEMAS_MPHILPSW",   label: "JEMAS PG — M.Phil PSW",        questionCount: 100, maxMarks: 100 },
    ];

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 7);
    const weekNum = getWeekNumber(now);

    for (const cfg of examConfigs) {
      const questions = await pickRandomQuestions(db, cfg.examId, cfg.questionCount);
      await db.collection("quizzes").add({
        title: `Weekly Mock — ${cfg.label} — Week ${weekNum}`,
        examId: cfg.examId,
        type: "weekly_mock",
        questions,
        maxMarks: cfg.maxMarks,
        startTime: admin.firestore.Timestamp.fromDate(now),
        endTime: admin.firestore.Timestamp.fromDate(endDate),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isAuto: true,
      });
    }

    await sendBulkNotification(
      "📝 New Weekly Mock Tests Live!",
      "This week's mock tests are ready. Attempt now for full leaderboard credit."
    );
  });

function getWeekNumber(d) {
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7);
}
```

### Supabase Alternative (pg_cron)
```sql
SELECT cron.schedule(
  'weekly-mock-upload',
  '0 6 * * 1',
  $$
    INSERT INTO quizzes (title, exam_id, type, start_time, end_time, max_marks, is_auto)
    SELECT
      'Weekly Mock — ' || label || ' — Week ' || to_char(now(), 'WW/YYYY'),
      exam_id, 'weekly_mock', now(), now() + interval '7 days', max_marks, true
    FROM exam_configs;
  $$
);
```

---

## 6. Notification Panel Fix

### Problem Checklist & Fixes

**Fix 1 — FCM Token not saved on login:**
```javascript
// Call this after every login / page load
import { getMessaging, getToken, onMessage } from "firebase/messaging";

async function initNotifications(userId) {
  const messaging = getMessaging();
  try {
    const token = await getToken(messaging, { vapidKey: "YOUR_VAPID_KEY" });
    if (token) {
      await updateDoc(doc(db, "users", userId), { fcmToken: token });
    }
  } catch (e) {
    console.warn("FCM init failed:", e);
  }

  // Handle foreground messages
  onMessage(messaging, (payload) => {
    showInAppBanner(payload.notification.title, payload.notification.body);
  });
}
```

**Fix 2 — Notification Firestore Structure:**
```javascript
// notifications/{notifId}
{
  title: "Weekly Mock Test Live!",
  body: "ANM/GNM weekly mock is ready to attempt.",
  targetExams: ["ANM_GNM"],   // or ["all"] for everyone
  type: "mock_test" | "result" | "announcement",
  createdAt: Timestamp,
  readBy: []                  // array of UIDs
}

// Query user's notifications:
const q = query(
  collection(db, "notifications"),
  where("targetExams", "array-contains-any", [...userTargetExams, "all"]),
  orderBy("createdAt", "desc"),
  limit(25)
);
```

**Fix 3 — Unread Badge Count:**
```javascript
function getUnreadCount(notifications, userId) {
  return notifications.filter(n => !n.readBy?.includes(userId)).length;
}

async function markRead(notifId, userId) {
  await updateDoc(doc(db, "notifications", notifId), {
    readBy: arrayUnion(userId)
  });
}

async function markAllRead(notifications, userId) {
  const batch = writeBatch(db);
  notifications.forEach(n => {
    if (!n.readBy?.includes(userId)) {
      batch.update(doc(db, "notifications", n.id), { readBy: arrayUnion(userId) });
    }
  });
  await batch.commit();
}
```

**Fix 4 — Service Worker (web push, required for background notifications):**
```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({ /* your config */ });
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/icons/app_icon.png'   // Use your main app icon
  });
});
```

---

## 7. Admin Panel

### Panel Structure

```
Admin Dashboard
│
├── 📥  UPLOAD QUESTIONS          ← One-click CSV/Excel upload (see below)
│
├── ❓  QUESTION BANK
│   ├── Add Single Question       ← Manual add with cascading dropdowns
│   ├── Browse & Edit             ← Filterable table
│   └── Bulk Import               ← CSV / Excel upload
│
├── 📝  QUIZ MANAGEMENT
│   ├── Create Quiz               ← Manual quiz builder
│   ├── Manage Quizzes            ← List with Live/Past/Upcoming badges
│   └── Weekly Mock Settings      ← Toggle auto-generate per exam ON/OFF
│
├── 🗂️  EXAM MAPPING
│   └── View/Edit Exam → Subject → Topic tree
│
├── 👥  USERS
│   ├── Search users
│   ├── View scores & history
│   └── Reset scores (admin only)
│
└── 🔔  NOTIFICATIONS
    ├── Send to All / By Exam / Single User
    └── Notification History
```

---

### One-Click Question Upload (CSV/Excel)

#### Step 1 — Download Template
Admin downloads a pre-formatted CSV template from the panel with these exact columns:

```
exam_id | subject | topic | subtopic | difficulty | category | question_text | option_a | option_b | option_c | option_d | correct_answer | explanation
```

#### Allowed Values Reference
```
exam_id:       JENPAS_UG_P1 | JENPAS_UG_P2 | ANM_GNM | JEPBN | JEMSCN |
               JEMAS_MHA | JEMAS_MPH | JEMAS_MLT | JEMAS_MAN | JEMAS_MBT |
               JEMAS_MPHILCP | JEMAS_MPHILPSW

category:      I   (single correct — options A/B/C/D, one correct)
               II  (multi correct — comma-separate multiple: "A,C")

difficulty:    Easy | Medium | Hard

correct_answer: A | B | C | D  (for Cat I)
                A,C  or  B,C,D  etc. (for Cat II — comma-separated)
```

#### Example CSV Rows
```csv
exam_id,subject,topic,subtopic,difficulty,category,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation
JENPAS_UG_P1,Biology,Human Physiology,Digestion,Easy,I,"The enzyme pepsin is secreted by:","Chief cells","Parietal cells","Mucous cells","G cells",A,"Pepsin is secreted as pepsinogen by chief cells (also called zymogenic cells)."
JENPAS_UG_P1,Physics,Thermodynamics,Kinetic Theory,Medium,II,"Which of the following are correct about ideal gases?","PV = nRT holds","Molecules have zero volume","Intermolecular forces are zero","Gas can be liquefied",A,B,C,"Ideal gases obey PV=nRT and assume zero molecular volume and no intermolecular forces."
ANM_GNM,Life Science,Inheritance & Genetics,Mendelian Laws,Easy,I,"Law of segregation was proposed by:","Darwin","Mendel","Morgan","De Vries",B,""
```

#### Upload Handler Code (React + Firebase)
```javascript
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

async function handleQuestionUpload(file) {
  let rows = [];

  // Parse CSV or Excel
  if (file.name.endsWith('.csv')) {
    const text = await file.text();
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });
    rows = result.data;
  } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  }

  // Validate & upload
  const errors = [];
  const batch = writeBatch(db);
  const VALID_EXAMS = [
    "JENPAS_UG_P1","JENPAS_UG_P2","ANM_GNM","JEPBN","JEMSCN",
    "JEMAS_MHA","JEMAS_MPH","JEMAS_MLT","JEMAS_MAN","JEMAS_MBT",
    "JEMAS_MPHILCP","JEMAS_MPHILPSW"
  ];

  rows.forEach((row, i) => {
    const rowNum = i + 2; // 1-indexed + header row

    // Validation
    if (!VALID_EXAMS.includes(row.exam_id)) {
      errors.push(`Row ${rowNum}: Invalid exam_id "${row.exam_id}"`);
      return;
    }
    if (!row.question_text?.trim()) {
      errors.push(`Row ${rowNum}: question_text is empty`);
      return;
    }
    if (!['I','II'].includes(row.category)) {
      errors.push(`Row ${rowNum}: category must be I or II`);
      return;
    }
    if (!row.correct_answer?.trim()) {
      errors.push(`Row ${rowNum}: correct_answer is missing`);
      return;
    }

    // Build question object
    const correctAnswers = row.correct_answer.split(',').map(s => s.trim().toUpperCase());
    const ref = doc(collection(db, "questions"));
    batch.set(ref, {
      examId:       row.exam_id.trim(),
      subject:      row.subject?.trim() || "",
      topic:        row.topic?.trim() || "",
      subtopic:     row.subtopic?.trim() || "",
      difficulty:   row.difficulty?.trim() || "Medium",
      category:     row.category.trim(),
      questionText: row.question_text.trim(),
      options: {
        A: row.option_a?.trim() || "",
        B: row.option_b?.trim() || "",
        C: row.option_c?.trim() || "",
        D: row.option_d?.trim() || "",
      },
      correctAnswers,                        // Array: ["A"] or ["A","C"]
      explanation:  row.explanation?.trim() || "",
      createdAt:    serverTimestamp(),
      uploadedBy:   currentAdmin.uid,
    });
  });

  if (errors.length > 0) {
    // Show errors to admin — do NOT upload anything
    showUploadErrors(errors);
    return { success: false, errors };
  }

  await batch.commit();
  showSuccess(`✅ ${rows.length} questions uploaded successfully!`);
  return { success: true, count: rows.length };
}
```

#### Admin Upload UI (simple)
```jsx
// One-click upload — single file input, auto-processes on selection
<div className="upload-zone">
  <h3>Upload Questions</h3>
  <p>CSV or Excel (.xlsx) — <a href="/template.csv" download>Download Template</a></p>
  <input
    type="file"
    accept=".csv,.xlsx,.xls"
    onChange={(e) => handleQuestionUpload(e.target.files[0])}
  />
  {/* Shows validation errors or success count after upload */}
  {uploadResult && <UploadResultPanel result={uploadResult} />}
</div>
```

---

### Manual Add Question — Cascading Dropdowns

```
[Dropdown 1]  Select Exam  ──────────────────────────────────────────────────
              JENPAS (UG) Paper I | JENPAS (UG) Paper II | ANM & GNM |
              JEPBN | JEMScN | JEMAS PG - MHA | JEMAS PG - MPH |
              JEMAS PG - MLT | JEMAS PG - MAN | JEMAS PG - MBT |
              JEMAS PG - M.Phil CP | JEMAS PG - M.Phil PSW

[Dropdown 2]  Select Subject  ─── filtered by exam (see Section 10)

[Dropdown 3]  Select Topic  ───── filtered by subject

[Dropdown 4]  Select Sub-Topic ── filtered by topic

[Dropdown 5]  Category: I (Single Correct) | II (Multi Correct)

[Dropdown 6]  Difficulty: Easy | Medium | Hard

              Question Text ──────── rich text / plain text
              Option A / B / C / D
              Correct Answer(s) ──── checkbox for Cat II
              Explanation ─────────── optional
```

### Firestore Exam Mapping Collections

```javascript
// exams/{examId}
{
  id: "JEMAS_MLT",
  label: "JEMAS PG — M.Sc. MLT",
  parentExam: "JEMAS_PG",         // groups JEMAS sub-courses
  maxMarks: 100,
  totalQuestions: 100,
  markingCategory: ["I"],         // only Cat I for JEMAS
  hasNegativeMarking: true,
  partialCredit: false
}

// subjects/{subjectId}
{
  id: "JEMAS_MLT_Biochemistry",
  examId: "JEMAS_MLT",
  label: "Biochemistry",
  questionCount: 35,
  marks: 35
}

// topics/{topicId}
{
  id: "JEMAS_MLT_Biochem_T1",
  subjectId: "JEMAS_MLT_Biochemistry",
  examId: "JEMAS_MLT",
  label: "Macromolecular Biochemistry & Enzymology",
  subtopics: [
    "Amino acid structures",
    "Protein folding dynamics",
    "Enzyme kinetics (Michaelis-Menten)",
    "Enzyme inhibition mechanisms"
  ]
}
```

---

## 8. Web Front Page Copy & Branding

### Header / Hero
```
APP NAME:    Practice West Bengal Nursing Exams

TAGLINE:     Your One Stop Platform to Practice for
             West Bengal Nursing Exams

CTA:         [ Start Practicing — Free ]    [ Explore Exams ↓ ]
```

### Supported Exams Section

| Exam Card | Description |
|-----------|-------------|
| **JENPAS (UG)** | B.Sc. Nursing, Allied Health Sciences & BHA |
| **ANM & GNM** | Auxiliary Nursing & Midwifery / General Nursing & Midwifery |
| **JEPBN 2026** | Post-Basic B.Sc. Nursing Entrance |
| **JEMScN 2026** | M.Sc. Nursing Entrance |
| **JEMAS (PG)** | MHA · MPH · M.Sc. MLT · MAN · M.Sc. MBT · M.Phil CP/PSW · MPT/MOT/MPO |

### Features Section
- ✅ Topic-wise practice questions
- ✅ Weekly auto-uploaded mock tests
- ✅ Real exam marking scheme (with negative marking)
- ✅ Subject-wise score analysis
- ✅ Rapid Fire challenge mode
- ✅ Leaderboards per exam

### Footer
```
© 2026 Practice West Bengal Nursing Exams
Developed by Aritra Banerjee & Arijit Dey. All Rights Reserved.
```

---

## 9. About Section

### Web App About Section
```
┌─────────────────────────────────────────┐
│                                         │
│   Practice West Bengal Nursing Exams    │
│   Version: [auto]                       │
│                                         │
│   A comprehensive practice platform     │
│   for all WBJEEB nursing and allied     │
│   health entrance examinations.         │
│                                         │
│   Covering JENPAS (UG), ANM & GNM,     │
│   JEPBN, JEMScN, and JEMAS (PG) with   │
│   real exam marking schemes, weekly     │
│   mock tests, rapid fire mode, and      │
│   subject-wise performance tracking.    │
│                                         │
│   ──────────────────────────────────    │
│   Developed by                          │
│   Aritra Banerjee                       │
│   Arijit Dey                            │
│                                         │
│   © 2026 All Rights Reserved            │
│   Unauthorized copying or distribution  │
  │   of web app content is prohibited.     │
│                                         │
│   [ Privacy Policy ]  [ Contact Us ]    │
└─────────────────────────────────────────┘
```

### React / Next.js Component
```jsx
<div className="about-section">
  <h2>Practice West Bengal Nursing Exams</h2>
  <p className="version">Version {process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"}</p>
  <hr />
  <div className="about-info">
    <p><strong>Developed by</strong></p>
    <p>Aritra Banerjee & Arijit Dey</p>
  </div>
  <div className="about-copyright">
    <p>© 2026</p>
    <p>All Rights Reserved</p>
  </div>
</div>
```

---

## 10. Full Exam → Subject → Topic Mapping

---

### EXAM: JENPAS (UG) — Paper I
**Stream:** B.Sc. Nursing & Allied Health Sciences
**Total:** 100 Q / 115 Marks | Cat I (+1/−0.25) | Cat II (+2/0, partial credit)

| Subject | Cat I | Cat II | Total Q | Marks |
|---------|-------|--------|---------|-------|
| Physics | 15 | 5 | 20 | 25 |
| Chemistry | 15 | 5 | 20 | 25 |
| Biology | 15 | 5 | 20 | 25 |
| Basic English | 20 | — | 20 | 20 |
| Health Aptitude | 20 | — | 20 | 20 |

#### Physics Topics
1. Units, Dimensions & Error Measurement
2. Kinematics & Vectors
3. Laws of Motion
4. Work, Energy & Power
5. Rigid Body Dynamics & Gravitation
6. Properties of Bulk Matter (Elasticity, Viscosity, Surface Tension)
7. Thermodynamics & Kinetic Theory
8. Oscillations & Simple Harmonic Motion
9. Mechanical Waves & Sound
10. Electrostatics & Current Electricity (Kirchhoff's Laws)
11. Magnetic Effects & Electromagnetic Induction & AC
12. Ray Optics & Wave Optics
13. Dual Nature of Matter, Atoms & Nuclei
14. Semiconductors, p-n Junction & Logic Gates

#### Chemistry Topics
**Physical:** Core Concepts, Atomic Structure, States of Matter, Thermodynamics, Equilibrium, Redox Reactions, Solutions, Electrochemistry, Chemical Kinetics, Surface Chemistry
**Inorganic:** Periodicity, Chemical Bonding & Molecular Structure, s-Block, p-Block, d & f-Block Elements, Coordination Compounds, Isolation of Elements
**Organic:** GOC, Hydrocarbons, Haloalkanes/Haloarenes, Alcohols/Phenols/Ethers, Aldehydes/Ketones, Carboxylic Acids, Amines, Biomolecules, Polymers, Chemistry in Everyday Life

#### Biology Topics
1. Diversity in Living Organisms (Classification of Plants & Animals)
2. Structural Organisation in Plants & Animals
3. Cell Structure, Cell Division & Biomolecules
4. Plant Physiology (Photosynthesis, Respiration, Growth & Hormones)
5. Human Physiology (Digestion, Breathing, Circulation, Excretion, Locomotion, Nervous & Endocrine)
6. Reproduction in Flowering Plants & Human Reproductive Systems
7. Genetics & Evolution (Mendelian Inheritance, Molecular Basis, Mutation, Modern Evolutionary Theory)
8. Biology & Human Welfare (Health, Immunology, Plant Breeding, Microbes in Human Welfare)
9. Biotechnology (Principles, DNA Recombination, Applications)
10. Ecology & Environment (Ecosystems, Population Dynamics, Biodiversity, Environmental Pollution)

#### Health Aptitude Topics
1. Human Body — Major organ systems & their primary functions
2. Nutrition — Balanced diet, macro/micronutrients, vitamins, minerals, deficiency diseases
3. Hygiene & Public Health — Personal hygiene, community sanitation, communicable disease prevention

#### Basic English Topics
1. Grammar (Articles, Prepositions, Tense, Voice Change, Narration)
2. Error Detection & Sentence Correction, Subject-Verb Agreement
3. Vocabulary (Synonyms, Antonyms, Idioms, One-word Substitutions)
4. Reading Comprehension, Cloze Tests, Ordering of Sentences

---

### EXAM: JENPAS (UG) — Paper II (BHA)
**Stream:** Bachelor of Hospital Administration
**Total:** 100 Q / 115 Marks | Cat I (+1/−0.25) | Cat II (+2/0, partial credit)

| Subject | Cat I | Cat II | Total Q | Marks |
|---------|-------|--------|---------|-------|
| Physical Science | 25 | 5 | 30 | 35 |
| Mathematics | 10 | 5 | 15 | 20 |
| General Knowledge | 10 | 5 | 15 | 20 |
| Basic English | 20 | — | 20 | 20 |
| Logical Reasoning | 20 | — | 20 | 20 |

#### Physical Science Topics (Class 10 Level)
**Physics Domain:** Mechanics, Laws of Motion, Work/Power/Energy, Sound Waves, Reflection/Refraction of Light, Current Electricity, Electromagnetism, Heat Transfer, Basic Modern Physics
**Chemistry Domain:** Classification of Matter, Atomic Structure, Chemical Reactions & Equations, Acids/Bases/Salts, Metals & Non-Metals, Carbon & Organic Compounds, Periodic Table Trends

#### Mathematics Topics (Class 10 Level)
1. Arithmetic — SI, CI, Uniform Rate of Growth/Decay, Partnership
2. Algebra — Real Numbers, Indices, Quadratic Equations, Ratio & Proportion, Quadratic Surds, Variations
3. Geometry & Mensuration — Circles, Tangents, Triangles, Similarity, Pyramids, Spheres, Cones, Cylinders
4. Trigonometry — Ratios, Basic Identities, Heights & Distances
5. Statistics — Mean, Median, Ogive, Mode

#### General Knowledge Topics (Class 12 Level)
1. Geography (Physical, Indian, Economic)
2. Indian History & National Freedom Movement
3. Indian Polity (Constitution, Governance, Panchayati Raj, Parliamentary rules)
4. Indian Economy, Budget & Fiscal Policy
5. General Science — Inventions, Discoveries
6. Current Affairs — Sports, Summits, Awards, Political Updates

#### Logical Reasoning Topics (Class 12 Level)
1. Verbal — Alphabet/Number Series, Analogies, Group Classification, Coding-Decoding, Blood Relations, Direction Sense, Logical Deductions
2. Non-Verbal — Pattern Completion, Figure Matrix, Mirror Images, Embedded Figures, Spatial Manipulation

---

### EXAM: ANM & GNM 2026
**Total:** 100 Q / 115 Marks | Bilingual (Bengali + English) | English only for Basic English & Logical Reasoning

| Subject | Cat I | Cat II | Total Q | Marks | Level |
|---------|-------|--------|---------|-------|-------|
| Life Science | 30 | 10 | 40 | 50 | Class 10 |
| Physical Science | 15 | 5 | 20 | 25 | Class 10 |
| Basic English | 15 | — | 15 | 15 | Class 12 |
| Mathematics | 10 | — | 10 | 10 | Class 10 |
| General Knowledge | 10 | — | 10 | 10 | Class 12 |
| Logical Reasoning | 5 | — | 5 | 5 | Class 12 |

#### Life Science Topics (Class 10)
1. Cellular Organisation — Cell structure, organelles, mitosis, meiosis, biomolecules
2. Animal & Human Physiology — Digestion, Respiration, Circulation, Excretion, Nervous system, Endocrine
3. Plant Physiology — Photosynthesis, Respiration, Transpiration, Growth regulators, Tropic movements
4. Inheritance & Genetics — Mendelian laws, mono/dihybrid crosses, genetic disorders, DNA/RNA
5. Health, Disease & Applied Biology — Pathogenic microbe structure, Immunology, Infectious & Non-infectious diseases, Vector control
6. Ecology — Ecosystem components, Energy flow, Food chains, Biodiversity, Population dynamics, Pollution

#### Physical Science Topics (Class 10)
1. Measurement & Matter — Units, States of matter, Mixtures, Solution properties
2. Force, Motion & Energy — Newton's laws, Momentum, Work/Power/Energy, Sound propagation
3. Thermal & Gaseous Behaviour — Ideal gas laws, Boyle's & Charles's laws, Kinetic theory, Heat transfer
4. Light & Optics — Reflection, Refraction, Spherical lenses, Dispersion, Eye defects
5. Current Electricity — Ohm's law, Resistance networks, Joule's heating, Electrolysis, Magnetism
6. Chemical Calculations & Atomic Chemistry — Mole concept, Atomic structure, Periodic trends, Bonding, Industrial inorganic chemistry

#### Mathematics Topics (Class 10)
1. Arithmetic — Natural numbers, Fractions, Ratios, %, Profit/Loss, SI, Partnership
2. Algebra — Exponents, Surds, Linear & Quadratic equations
3. Geometry & Mensuration — Triangle & circle theorems, Area, Perimeter, Volume/Surface of cylinders/cones/spheres

---

### EXAM: JEPBN 2026
**Total:** 100 Q / 100 Marks | Cat I only (+1/−0.25) | Duration: 90 min

| Part | Domain | Total Q | Marks |
|------|--------|---------|-------|
| Part A | Biological & Social Sciences (Foundational) | 40 | 40 |
| Part B | Applied Nursing Sciences (Advanced Disciplines) | 60 | 60 |

#### Part A Subjects & Topics

**Anatomy**
- Skeletal & Muscular Architecture — Bone classification, Joint types, Muscle fiber anatomy
- Cardio-Respiratory & Visceral Systems — Heart chambers/valves/coronary arteries, Respiratory tract, GI layers, Liver/Pancreas
- Neuro-Urinary & Endocrine Layout — CNS segments, Nephron anatomy, Endocrine gland positions

**Physiology**
- Hematology & Cardiovascular — Plasma/RBC/WBC/Platelet life cycles, Coagulation cascade, Cardiac cycle, BP regulation
- Respiratory, Digestive & Renal — Gas exchange/partial pressures, Enzymatic breakdown pathways, GFR, Micturition reflex
- Endocrine & Reproduction — Hormonal feedback loops, Spermatogenesis, Oogenesis, Menstrual cycle

**Microbiology**
- Bacteriology & Virology — Bacterial morphology, Gram+/Gram−, Viral replication cycles
- Sterilization & Infection Control — Autoclaving, Hot air oven, Disinfectants, CSSD workflow
- Immunology & Serology — Innate/Adaptive immunity, IgG/IgM/IgA/IgE/IgD, ELISA, Widal, PCR

**Pathology**
- Cellular Adaptation & Tissue Injury — Atrophy, Hypertrophy, Hyperplasia, Metaplasia, Apoptosis, Necrosis
- Inflammation & Hemodynamic Disorders — Acute/Chronic inflammation, Edema, Thrombosis, Embolism, Shock
- Neoplasia & Healing — Benign vs. Malignant tumors, Staging, Wound healing (primary/secondary intention)

**Pharmacology**
- Pharmacokinetics & Pharmacodynamics — Absorption, Bioavailability, Receptor binding, Therapeutic index
- Systemic Therapeutics — Autonomic drugs, Cardiovascular agents, CNS agents
- Chemotherapy & Antibiotic Stewardship — Beta-lactams, Aminoglycosides, Macrolides, Fluoroquinolones, Antifungals, Resistance mechanisms

**Nutrition**
- Macronutrient & Micronutrient Energetics — BMR, Fat-soluble vitamins (A/D/E/K), Water-soluble vitamins (B-complex/C)
- Therapeutic Dietetics & Deficiencies — Diabetic/Renal/Low-sodium diets, PEM, Marasmus, Kwashiorkor, Trace mineral deficiencies

**Psychology**
- Cognitive Processes & Behaviour — Classical/Operant conditioning, Memory, Attention, Perception, Emotional intelligence
- Personality & Defense Mechanisms — Id/Ego/Superego, Personality typology, Projection/Rationalization/Sublimation/Displacement

**Sociology**
- Social Groups & Cultural Frameworks — Primary/Secondary groups, Caste/Class/Religion impact on healthcare
- Social Pathology — Poverty, Substance abuse, Domestic violence, Population growth

#### Part B Applied Nursing Sciences Topics

**Fundamentals of Nursing**
- Nursing process steps (Assessment → Diagnosis → Planning → Implementation → Evaluation)
- Therapeutic communication, Documentation, Legal-ethical frameworks
- Vital signs measurement (TPR/BP), Medication administration, IV fluid rate calculations
- Aseptic cleaning, Wound dressing, Catheterization, Bed-sore prevention

**Medical-Surgical Nursing**
- Perioperative Care — Pre-op checklist, Intra-op monitoring, Post-anesthesia scoring
- Acid-base imbalances — Respiratory/Metabolic Acidosis & Alkalosis, ABG interpretation
- Cardiovascular — MI, Heart Failure, CAD, Hypertension, Dysrhythmias
- Respiratory — COPD, Asthma, Pneumonia, ARDS, Chest Drainage (UWCD)
- GI — Peptic Ulcer, Cirrhosis, Pancreatitis, IBD
- Renal — CKD stages, Hemodialysis, AKI
- Endocrine — DM Type 1/2, DKA, Hyperthyroidism, Hypothyroidism
- Neurological — Stroke care, Increased ICP signs, Glasgow Coma Scale

**Pediatric Nursing**
- Anthropometric tracking, Developmental milestones (Piaget, Erikson, Freud), Neonatal reflexes
- KMC protocols, Neonatal resuscitation, APGAR scoring, LBW management
- Congenital malformations — Cleft Lip/Palate, Tracheoesophageal Fistula, Hirschsprung's, Spina Bifida
- IMNCI protocols — Respiratory infections, Dehydration grading, Severe malnutrition

**Psychiatric Nursing**
- MSE structure, ICD/DSM classification, Thought content analysis
- Schizophrenia, Bipolar Disorder, OCD, Substance withdrawal, Delirium/Dementia care
- Antipsychotic/Antidepressant side effects, Lithium toxicity monitoring, ECT setup

**Obstetrical Nursing**
- Physiological changes in pregnancy, EDD/Gravida/Para calculations, NST/USG profiles
- Labor stages, Partograph plotting, AMTSL
- Preeclampsia, Eclampsia, PPH, Obstructed Labor management
- Lactation mechanics, Puerperal sepsis, LBW neonate management

**Community Health Nursing**
- Epidemiological triad, Disease transmission, Incidence/Prevalence, MMR/IMR/CBR
- Sub-center/PHC/CHC administrative frameworks, NHM, RCH, NTEP, Vector-Borne Control
- Contraceptive mechanism indexing, Cold-chain maintenance, Solid-waste management

---

### EXAM: JEMScN 2026
**Total:** 100 Q / 100 Marks | Cat I only (+1/−0.25) | Duration: 90 min
**Tie-break rule:** Higher Part B marks → then fewer total negative marks

| Part | Domain | Total Q | Marks |
|------|--------|---------|-------|
| Part A | Basic & Allied Sciences + Education + Research | 40 | 40 |
| Part B | Core Clinical Nursing | 60 | 60 |

#### Part A Subjects & Topics

**Anatomy & Physiology**
- General & Systemic Anatomy — Epithelial/Connective/Muscular/Nervous tissues, Skeletal system, CNS pathways
- Systemic Physiology — Blood composition/clotting, Cardiac dynamics, Respiratory volumes, Nephron filtration, GI secretions, Endocrine feedback
- Embryology & Histology — Gametogenesis, Germ layer differentiation, Microscopic anatomy

**Pathology & Genetics**
- General Pathology — Cellular adaptation, Necrosis models, Wound healing
- Systemic Pathology — Thrombosis, Embolism, Systemic shock, Neoplasia, Blood profile alterations (Anemias, Leukemias)
- Applied Human Genetics — Mendelian inheritance, Down/Turner/Klinefelter syndromes, Molecular mutations, Genetic counseling

**Microbiology & Pharmacology**
- Medical Bacteriology & Virology — Gram staining, Culture media, Viral replication, Clinical pathogen identification
- Immunology & Environmental Hygiene — Innate/Adaptive immunity, IgG/IgM/IgA, Sanitation controls
- Clinical Pharmacology — Drug classifications, Pharmacodynamics, High-alert medications, Nurse-led calculations

**Psychology & Sociology**
- Advanced Psychology — Behavior theories, Cognitive processes, Memory models, Defense mechanisms, Psychosocial adaptations
- Applied Sociology — Social stratification, Cultural impacts on wellness, Family types, Urban/Rural demographics, Social issues

**Nursing Administration & Management**
- Healthcare Administration — Management theories, Planning cycles, Budgeting, Audit tools
- Personnel Management — Staffing calculations, Job descriptions, Performance appraisal, Leadership styles, INC guidelines

**Nursing Education & Ethics**
- Educational Methodology — Curriculum design, Lesson planning, Teaching aids, OSCE, Formative/Summative evaluation
- Professional Ethics — Code of Conduct, Consumer protection, Legal accountability, Clinical ethical dilemmas

**Research Methodology & Biostatistics**
- Nursing Research — Problem formulation, Literature review, Quantitative/Qualitative designs, Sampling, Tool testing
- Biostatistics — Mean/Median/Mode, SD/Variance, Parametric vs Non-parametric testing, Standard error

#### Part B Core Clinical Nursing Topics

**Foundation of Nursing**
- Nursing theories — Orem, Nightingale, Roy, Peplau; Nursing process; Documentation standards
- Infection control, Medical/Surgical asepsis, Hospital waste segregation, Patient safety, Emergency life support

**Medical-Surgical Nursing**
- Critical/Perioperative — Airway management, Mechanical ventilation, ABG analysis, Fluid-electrolyte management
- Cardiovascular — MI, Heart Failure, Respiratory — COPD/ARDS, GI — Hepatic coma/Pancreatitis, Renal — AKI/CKD, Neurological — Stroke/ICP, Musculoskeletal
- Oncology & Immunological Care — Cancer staging, Chemotherapy, Radiation nursing, Autoimmune/Immunodeficiency nursing

**Pediatric Nursing**
- Developmental milestones — Piaget/Erikson from infancy to adolescence, Anthropometric tracking
- Neonatal — High-risk protocols, NR algorithms, APGAR, LBW, IMNCI
- Congenital & Acute Pathologies — Structural malformations, Pediatric infections, Dehydration, Nutritional deficiencies

**Psychiatric Nursing**
- MSE, Classification benchmarks, Therapeutic communication
- Schizophrenia, Mood disorders, Anxiety, Personality disorders, Substance withdrawal, Geriatric mental health
- ECT preparation/monitoring, Psychopharmacology, Lithium monitoring, Behavioral modification

**Obstetrical & Gynecological Nursing**
- Antenatal — Physiological changes, Screening schedules, NST/Biophysical profiles, Obstetric calculations
- Intrapartum & Postpartum — Labor progression, Partograph, AMTSL, Eclampsia, PPH, Obstructed labor
- Gynecological — RTI, Menstrual irregularities, Uterine displacements, Infertility protocols

**Community Health Nursing**
- Epidemiological tracking, Demographic rates (MMR/IMR/CBR), Environmental health
- PHC/CHC delivery networks, National health programs, Vaccine cold-chain, Family planning

---

### EXAM GROUP: JEMAS (PG) 2026
**All sub-courses:** 100 Q / 100 Marks | Cat I only (+1/−0.25) | Duration: 90 min

---

#### JEMAS Sub-Course: MHA (Master of Hospital Administration)

| Subject | Q | Marks |
|---------|---|-------|
| General Science | 30 | 30 |
| Logical Reasoning | 20 | 20 |
| General Knowledge | 20 | 20 |
| English Language | 20 | 20 |
| Arithmetic | 10 | 10 |

**Arithmetic Topics:**
- Number Systems — Primes, Composites, Divisibility, HCF/LCM
- Business Mathematics — Ratios, Proportions, %, Profit/Loss, Discount, SI/CI, Partnerships
- Work & Speed — Time-Work, Pipes & Cisterns, Speed/Distance, Relative Motion
- Data Interpretation — Tables, Line graphs, Bar charts, Pie charts, Averages

**Logical Reasoning Topics:**
- Alphanumeric & Series — Number series, Letter coding, Pattern tracking, Missing characters
- Relational & Spatial — Blood relations, Directional vectors, Seating arrangements (linear & circular)
- Verbal & Syllogistic Logic — Categorical syllogisms, Venn diagrams, Statement-assumption, Cause-effect

**General Science Topics:**
- Physics — SI units, Laws of motion, Work/Power/Energy, Thermodynamics, Light (reflection/refraction/lens), Ohm's law
- Chemistry — States of matter, Atomic structure, Periodic table trends, Chemical bonding, Acids/Bases/Salts, Organic carbon compounds
- Biology — Cell anatomy, Cell cycle (mitosis/meiosis), Organ systems (Circulatory, Respiratory, Digestive, Nervous, Endocrine), Vitamins/Minerals/Deficiency states

**English Language Topics:**
- Grammar — Subject-verb agreement, Tense, Prepositions, Articles, Active/Passive voice
- Vocabulary & Cohesion — Synonyms, Antonyms, Idioms, Cloze tests, Sentence jumbles, Reading comprehension

**General Knowledge Topics:**
- Constitutional Foundations — Preamble, Fundamental Rights, DPSP, Parliament structure
- Indian Healthcare Ecosystem — MoHFW organisation, Sub-center/PHC/CHC structure, Hospital administration basics

---

#### JEMAS Sub-Course: MPH (Master of Public Health)

| Subject | Q | Marks |
|---------|---|-------|
| Medical Sciences (Allopathy, AYUSH, Dentistry, Pharmacy, Nursing) | 35 | 35 |
| Social Sciences (Anthropology, Sociology, Economics, Rural Dev) | 35 | 35 |
| Biological Science (Botany, Chemistry, Zoology, Physiology, Biotech) | 15 | 15 |
| Statistical Ability & Public Health GK | 15 | 15 |

**Medical Sciences Topics:**
- Human anatomy/physiology basics, Clinical pharmacology parameters
- Common dental diseases, AYUSH fundamentals (Ayurveda/Homeopathy/Unani/Siddha/Yoga)
- Nursing fundamentals, Immunization mechanics, Infection control

**Social Sciences Topics:**
- Anthropological & Sociological — Social structure, Family systems, Cultural illness beliefs, Community dynamics, Social research methods
- Health Economics — Supply/Demand in healthcare, Health financing models, Rural poverty indicators, Health planning
- Environmental & Social Determinants — Urbanization health impacts, Clean water supply, Waste sanitation, Kuppuswamy/Prasad scales, Gender barriers to care

**Biological Sciences Topics:**
- Cellular biology, Plant/Animal kingdom classification, Basic inheritance principles, Molecular biology

**Biostatistics & Public Health GK Topics:**
- Data types, Data collection methods, Mean/Median/Mode, Variance/SD, Sampling methodologies, Basic hypothesis testing
- Epidemiology triad, Disease transmission models, Natural history of disease, Incidence/Prevalence, MMR/IMR/CBR
- NHM structures, Ayushman Bharat, Public health trends, Disease elimination timelines

---

#### JEMAS Sub-Course: M.Sc. MLT (Medical Laboratory Technology)

| Subject | Q | Marks |
|---------|---|-------|
| Biochemistry (BMLT standard) | 35 | 35 |
| Microbiology (BMLT standard) | 35 | 35 |
| Hematology (BMLT standard) | 30 | 30 |

**Biochemistry Topics:**
- Macromolecular Biochemistry & Enzymology — Amino acid structures, Protein folding, Enzyme kinetics (Michaelis-Menten), Enzyme inhibition mechanisms
- Metabolic Pathways — Glycolysis, TCA cycle, Glycogen synthesis/breakdown, Beta-oxidation of fatty acids, Urea cycle, Metabolic storage disorders
- Clinical Analytics & Diagnostics — Liver/Renal function panels, Cardiac markers, Lipid profiling, Blood gas values, Biochemistry analyzer automation

**Microbiology Topics:**
- Systematic Bacteriology & Mycology — Gram/Ziehl-Neelsen staining, Bacterial cell walls, Culture media, Staphylococcus/Enterobacteriaceae identification
- Virology & Parasitology — Viral cultivation, PCR diagnostics, Plasmodium/Entamoeba lifecycle & identification
- Immunochemistry & Serology — Innate/Adaptive immunity, Antigen-Antibody structure, Hypersensitivity, ELISA/Widal/Western Blot

**Hematology Topics:**
- Core Hematology & Pathologies — Erythropoiesis, Anemia morphological classification, Leukopoiesis, Leukemia diagnostic features, Manual/Automated CBC
- Coagulation Studies & Bone Marrow — Hemostasis physiology, PT/APTT/INR, Bone marrow collection/staining/biopsy
- Blood Banking & Immunohematology — ABO/Rh systems, Cross-matching protocols, Donor screening, Component preparation, Transfusion reaction management

---

#### JEMAS Sub-Course: MAN (Master of Applied Nutrition)

| Subject | Q | Marks |
|---------|---|-------|
| Physiology & Anatomy Foundations | 25 | 25 |
| Biochemistry & Food Sciences | 25 | 25 |
| Basic Nutrition & Community Health | 25 | 25 |
| Maternal and Child Nutrition | 25 | 25 |

**Topics:**
- **Physiology & Anatomy** — Digestive system anatomy, Metabolic organ physiology, Hormonal regulation of nutrition
- **Biochemistry & Food Sciences** — Nutrient chemistry (carbohydrates, proteins, lipids, vitamins, minerals), Food processing, Preservation, Food safety
- **Basic Nutrition & Community Health** — Balanced diet principles, Nutritional assessment methods, Community nutrition programs, Epidemiology of nutritional disorders
- **Maternal & Child Nutrition** — Nutritional requirements in pregnancy and lactation, Infant and young child feeding (IYCF), ICDS programs, Growth monitoring

---

#### JEMAS Sub-Course: M.Sc. MBT (Medical Biotechnology)

| Subject | Q | Marks |
|---------|---|-------|
| Nucleotides, Nucleic Acids, DNA & RNA-based Information Processes | 25 | 25 |
| Genes, Chromosomes & Molecular Enzymology | 25 | 25 |
| Protein Chemistry (Amino Acid Composition, Structure & Functions) | 25 | 25 |
| Carbohydrates, Polysaccharides, Lipids & Biomembranes | 25 | 25 |

**Topics:**
- **Nucleotides & Nucleic Acids** — DNA/RNA structure, Replication, Transcription, Translation, Post-translational modifications, Restriction enzymes
- **Genes & Chromosomes** — Chromosome structure, Gene expression regulation, Molecular cloning, PCR, Gel electrophoresis, Recombinant DNA technology
- **Protein Chemistry** — Amino acid classification, Protein primary/secondary/tertiary/quaternary structure, Enzyme kinetics, Michaelis-Menten equation, Allosteric regulation
- **Carbohydrates, Lipids & Biomembranes** — Monosaccharide/Disaccharide/Polysaccharide structure, Glycolysis, Fatty acid structure, Phospholipid bilayer, Membrane transport mechanisms

---

#### JEMAS Sub-Course: M.Phil CP (Clinical Psychology) & M.Phil PSW (Psychiatric Social Work)
*(Same paper for both — identical question pattern)*

| Subject | Q | Marks |
|---------|---|-------|
| General Psychology & Clinical Psychology | 30 | 30 |
| Developmental & Social Psychology | 25 | 25 |
| Biological Psychology & Sociology Foundations | 25 | 25 |
| Psychiatry Basics, General Knowledge & Current Health Affairs | 20 | 20 |

**Topics:**
- **General & Clinical Psychology** — Theories of personality, Abnormal psychology, Psychological assessment tools, Psychotherapeutic modalities (CBT, DBT, Psychoanalysis), Behaviour modification techniques
- **Developmental & Social Psychology** — Lifespan developmental theories (Piaget, Erikson, Kohlberg), Social influence, Attitude formation, Group dynamics, Interpersonal relationships
- **Biological Psychology & Sociology** — Neurobiological bases of behaviour, Neurotransmitter systems, Brain anatomy related to mental illness, Social determinants of mental health, Cultural aspects of psychiatry
- **Psychiatry Basics & GK** — ICD & DSM classification systems, Major psychiatric disorders (Schizophrenia, Mood disorders, Anxiety disorders, OCD, PTSD), Mental Health Act, National Mental Health Policy, Current global mental health affairs

---

#### JEMAS Sub-Course: MPT / MOT / MPO

| Subject | Q | Marks |
|---------|---|-------|
| General Biological Science | 50 | 50 |
| Bachelor Core Disciplines (BPT / BOT / BPO standard respectively) | 50 | 50 |

**General Biological Science Topics (50 Q):**
- Cellular biology, Human organ systems, Musculoskeletal anatomy, Neuroanatomy, Basic physiology of movement, Pathology of disability

**BPT Core Topics (50 Q for MPT):**
- Anatomy & Physiology of movement, Musculoskeletal physiotherapy, Neurological physiotherapy, Cardiopulmonary physiotherapy, Rehabilitation principles, Exercise physiology

**BOT Core Topics (50 Q for MOT):**
- Occupational performance frameworks, Sensory integration, ADL assessment & training, Cognitive rehabilitation, Splinting & assistive devices

**BPO Core Topics (50 Q for MPO):**
- Biomechanics of prosthetics & orthotics, Lower/Upper limb prosthetic designs, Spinal orthoses, Gait analysis, Materials science in prosthetics

---

#### JEMAS Single-Discipline Papers: Dip Diet / DHPE / DHS / FPM / MSLP / M.Sc. CCS / OTS / PS

All = 100 Q / 100 Marks, single-discipline, no sub-partitioning.

| Course | Content Focus |
|--------|--------------|
| Dip Diet | Basic Nutrition, Physiology, Chemistry, Basic Food Science |
| DHPE | Basic Public Health Sciences |
| DHS | Higher Secondary Mathematics + Core Statistics |
| FPM | MBBS Standard — Anatomy/Physiology/Biochemistry/Pathology/Pharmacology/Psychiatry/Anesthesiology/Physical Medicine/Orthopedics/Rheumatology/Oncology/Community Medicine related to Pain |
| MSLP | Introduction to Speech-Language Pathology, Childhood Communication Disorders, Articulation/Phonological Disorders, Voice/Laryngectomy, Fluency Variations, Adult Neuromotor Speech Disorders |
| M.Sc. CCS | Critical Care Technology — Bachelor standard |
| M.Sc. OTS | Operation Theatre Technology — Bachelor standard |
| M.Sc. PS | Perfusion Technology — Bachelor standard |

---

## 11. Icon Guide (Minimal Set)

Use only **5–6 icons** total. Keep it clean and functional.

### Recommended Minimal Icon Set

| Icon File | Used For |
|-----------|----------|
| `app_icon.png` | Web app icon (favicon), notification icon |
| `exam_icon.png` | Exam/quiz cards, question bank |
| `rapid_fire_icon.png` | Rapid fire mode entry button |
| `leaderboard_icon.png` | Leaderboard screen |
| `profile_icon.png` | User profile / avatar fallback |

> That's it — 5 icons. Everything else uses system/built-in icons (Material Icons / Cupertino Icons).

### React / Next.js
```javascript
// Store in /public/icons/ — access as:
<img src="/icons/rapid_fire_icon.png" alt="Rapid Fire" />

// Or import as module:
import examIcon from '@/public/icons/exam_icon.png';
```

### Where Each Icon Appears
```
app_icon.png        → Browser tab (favicon), push notification badge, loading screen logo
exam_icon.png       → Exam selection cards, Question Bank header, Mock Test cards
rapid_fire_icon.png → Rapid Fire mode home card, locked tier cards
leaderboard_icon.png→ Leaderboard tab, post-quiz leaderboard link
profile_icon.png    → Profile tab icon, avatar placeholder when no photo uploaded
```

> **Note:** Your 5 icon files were not in the uploaded files this session — only markdown files were uploaded. Please upload the icon files and they will be slotted in at the paths above.

---

## 12. Rapid Fire — Sequential Unlock & Answer Fix

### Rapid Fire Design: Sequential Unlock

> Tiers unlock **one at a time** based on **cumulative marks earned** across all quiz attempts.
> A student cannot skip tiers — they must unlock Tier 2 before Tier 3, and so on.

### Tier Definitions

| Tier | Name | Cumulative Marks to Unlock | Timer per Q | Marks per Correct | Marks Penalty Wrong |
|------|------|---------------------------|-------------|-------------------|---------------------|
| 1 | Starter Blitz | 0 (always available) | 15 sec | +1 | −0.25 (mirrors Cat I) |
| 2 | Speed Seeker | 200 marks total | 10 sec | +1 | −0.25 |
| 3 | Fast Track | 600 marks total | 7 sec | +1 | −0.25 |
| 4 | Lightning Round | 1,500 marks total | 5 sec | +1 | −0.25 |
| 5 | Storm Elite | 3,500 marks total | 3 sec | +1 | −0.25 |

> Rapid fire always uses **Category I marking** (+1 / −0.25). No Category II in rapid fire.

### Sequential Unlock Logic

```javascript
const RAPID_FIRE_TIERS = [
  { tier: 1, name: "Starter Blitz",  marksRequired: 0,    timerSec: 15 },
  { tier: 2, name: "Speed Seeker",   marksRequired: 200,  timerSec: 10 },
  { tier: 3, name: "Fast Track",     marksRequired: 600,  timerSec: 7  },
  { tier: 4, name: "Lightning Round",marksRequired: 1500, timerSec: 5  },
  { tier: 5, name: "Storm Elite",    marksRequired: 3500, timerSec: 3  },
];

function getRapidFireStatus(totalMarksEarned) {
  return RAPID_FIRE_TIERS.map((tier, index) => {
    const prevTierUnlocked = index === 0 || totalMarksEarned >= RAPID_FIRE_TIERS[index - 1].marksRequired;
    const thisUnlocked = totalMarksEarned >= tier.marksRequired;
    return {
      ...tier,
      unlocked: thisUnlocked,
      // Next tier progress — only show progress toward the NEXT locked tier
      progressToNext: index < RAPID_FIRE_TIERS.length - 1
        ? Math.min(100, Math.round((totalMarksEarned / RAPID_FIRE_TIERS[index + 1].marksRequired) * 100))
        : 100,
      marksNeededToUnlock: Math.max(0, tier.marksRequired - totalMarksEarned)
    };
  });
}

// UI: show tiers in a vertical list — each tier unlocks ONE at a time
// Locked tiers show a padlock + "X marks needed"
// Unlocked tiers show a "Play" button
```

### Rapid Fire: One Question Opens at a Time

```javascript
// State machine — one question active at a time, no skipping
const [currentQIndex, setCurrentQIndex] = useState(0);
const [answered, setAnswered] = useState(false);
const [selectedOption, setSelectedOption] = useState(null);
const [showResult, setShowResult] = useState(false);
const [timeLeft, setTimeLeft] = useState(tier.timerSec);
const [timerActive, setTimerActive] = useState(true);

// Timer
useEffect(() => {
  if (!timerActive || answered) return;
  if (timeLeft <= 0) {
    handleTimeout(); // Auto-skip — counts as skipped (0 marks)
    return;
  }
  const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
  return () => clearTimeout(t);
}, [timeLeft, timerActive, answered]);

function handleTimeout() {
  setAnswered(true);
  setShowResult(true);
  setTimerActive(false);
  // No marks change — treated as skipped
  setTimeout(advanceToNext, 1500);
}
```

### Answer Display Fix (Answers Not Popping Up)

```javascript
function handleOptionSelect(optionIndex) {
  if (answered) return;            // Block double-tap

  setAnswered(true);               // Lock selection immediately
  setSelectedOption(optionIndex);
  setTimerActive(false);           // Stop timer
  setShowResult(true);             // ← Show answer panel

  const isCorrect = optionIndex === currentQuestion.correctAnswer;

  // Update running marks
  setRunningMarks(prev =>
    isCorrect ? prev + 1.0 : prev - 0.25
  );

  // Pause 1.5 seconds to show answer, then next question
  setTimeout(() => {
    setShowResult(false);
    setAnswered(false);
    setSelectedOption(null);
    setTimeLeft(tier.timerSec);   // Reset timer for next question
    setTimerActive(true);
    advanceToNext();
  }, 1500);
}

function advanceToNext() {
  if (currentQIndex + 1 >= questions.length) {
    endRapidFireSession();
  } else {
    setCurrentQIndex(prev => prev + 1);
  }
}
```

### Answer Panel JSX (what student sees for 1.5 seconds)

```jsx
{/* Option buttons */}
{currentQuestion.options.map((opt, i) => (
  <button
    key={i}
    onClick={() => handleOptionSelect(i)}
    disabled={answered}
    style={{
      backgroundColor: showResult
        ? i === currentQuestion.correctAnswer
          ? '#22c55e'    // Green — always show correct
          : i === selectedOption
            ? '#ef4444'  // Red — wrong selection
            : '#64748b'  // Grey — unselected
        : '#1e293b'      // Default dark
    }}
  >
    {opt}
  </button>
))}

{/* Answer reveal panel — shown for 1.5 sec */}
{showResult && (
  <div className="answer-reveal">
    {selectedOption === null
      ? <span>⏰ Time's up!</span>
      : selectedOption === currentQuestion.correctAnswer
        ? <span>✅ Correct! +1 mark</span>
        : <span>❌ Wrong! −0.25 marks</span>
    }
    <p><strong>Correct:</strong> {currentQuestion.options[currentQuestion.correctAnswer]}</p>
    {currentQuestion.explanation && (
      <p className="explanation">{currentQuestion.explanation}</p>
    )}
  </div>
)}
```

### React Equivalent

```jsx
function handleOptionSelect(optionIndex) {
  if (answered) return;
  setAnswered(true);
  setSelectedOption(optionIndex);
  setTimerActive(false);
  setShowResult(true);
  setRunningMarks(prev =>
    optionIndex === currentQuestion.correctAnswer ? prev + 1.0 : prev - 0.25
  );
  setTimeout(() => {
    setShowResult(false);
    setAnswered(false);
    setSelectedOption(null);
    setTimeLeft(tier.timerSec);
    setTimerActive(true);
    advanceToNext();
  }, 1500);
}

// Option color logic
function getOptionColor(index) {
  if (!showResult) return '#1e293b';
  if (index === currentQuestion.correctAnswer) return '#22c55e';
  if (index === selectedOption) return '#ef4444';
  return '#64748b';
}
```

---

## 13. Per-Exam Marking Scheme Reference

| Exam | Max Marks | Cat I Correct | Cat I Wrong | Cat II Correct | Cat II Wrong | Partial Credit (Cat II) |
|------|-----------|---------------|-------------|----------------|--------------|------------------------|
| JENPAS (UG) P1 | 115 | +1 | −0.25 | +2 | 0 | Yes — Score = 2 × (marked correct / total correct) |
| JENPAS (UG) P2 | 115 | +1 | −0.25 | +2 | 0 | Yes — same formula |
| ANM & GNM | 115 | +1 | −0.25 | +2 | 0 | Yes — same formula |
| JEPBN | 100 | +1 | −0.25 | N/A | N/A | No |
| JEMScN | 100 | +1 | −0.25 | N/A | N/A | No |
| JEMAS PG (all sub-courses) | 100 | +1 | −0.25 | N/A | N/A | No |
| Rapid Fire (all tiers) | Session-based | +1 | −0.25 | N/A | N/A | No |

### Category II Partial Credit Formula (for JENPAS & ANM/GNM)
```
Score = 2 × (Number of Correct Options Marked / Total Correct Options Available)
Condition: NO incorrect option must be marked
If any wrong option is selected → Score = 0 (no penalty, just 0)
If all correct options selected with no wrong → Score = +2 (full marks)
```

### Unattempted = Always 0 Marks (no penalty for skipping)

---

## Summary Checklist for OpenCode

Copy into your project board / tasks:

- [ ] **Auth** — Email domain whitelist (frontend + Cloud Function backend)
- [ ] **Profile** — 3-step onboarding wizard; JEMAS sub-course selector on Step 2
- [ ] **Scoring** — Remove all XP references; implement marks-based scoring with negative marking
- [ ] **Marks calculation** — Cat I (+1/−0.25), Cat II (+2/0/partial), stored per attempt
- [ ] **Quiz attempts** — Any time allowed; live = leaderboard eligible; past = personal history only
- [ ] **Weekly mocks** — Firebase scheduled function (Monday 6 AM IST) for all 12 exam configs
- [ ] **Notifications** — FCM token save on login, service worker, unread badge, markAllRead
- [ ] **Admin: One-click upload** — CSV/Excel template download + papaparse/xlsx parse + batch Firestore write + validation error display
- [ ] **Admin: Cascading dropdowns** — Exam (12 options) → Subject → Topic → Sub-topic
- [ ] **Front page** — "Practice West Bengal Nursing Exams — Your One Stop Platform..."
- [ ] **About screen** — Aritra Banerjee & Arijit Dey, © 2026
- [ ] **Exam mapping seed** — Seed Firestore from the Section 10 tables (all 12 exam configs)
- [ ] **Icons** — 5 icons only: app / exam / rapid_fire / leaderboard / profile
- [ ] **Rapid fire answer fix** — setShowResult(true) before timer advances; 1.5s pause; green/red/grey coloring
- [ ] **Rapid fire sequential unlock** — 5 tiers, marks milestones: 0/200/600/1500/3500; locked tiers show progress bar + marks needed

---

*Document v2 — May 2026*
*© 2026 Aritra Banerjee & Arijit Dey. All Rights Reserved.*
