'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Swords, Trophy, BarChart3, Zap, ScrollText, CheckCircle } from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';

const TAGLINES = [
  'Battle Your Way to WB Nursing Success',
  'Level Up Your Nursing Rank',
  'Compete. Practice. Crack WBJEE Nursing.',
  'Daily Battles. Real Rank Growth.',
  'From Quiz Battles to Nursing Rank.',
];

const features = [
  { icon: CheckCircle, title: 'Topic-wise Practice', desc: 'Topic-wise questions with real marking scheme' },
  { icon: Swords, title: 'Weekly Mock Tests', desc: 'Auto-uploaded full-length mocks every Monday' },
  { icon: Trophy, title: 'Real Exam Scoring', desc: 'Category I & II with negative marking' },
  { icon: BarChart3, title: 'Subject-wise Analysis', desc: 'Track performance across subjects' },
  { icon: Zap, title: 'Rapid Fire Mode', desc: 'Speed rounds with unlockable tiers' },
  { icon: ScrollText, title: 'Leaderboards', desc: 'Compete per exam with marks-based ranking' },
];

const exams = [
  { name: 'JENPAS (UG)', desc: 'B.Sc. Nursing, Allied Health Sciences & BHA' },
  { name: 'ANM & GNM', desc: 'Auxiliary Nursing & Midwifery / General Nursing & Midwifery' },
  { name: 'JEPBN 2026', desc: 'Post-Basic B.Sc. Nursing Entrance' },
  { name: 'JEMScN 2026', desc: 'M.Sc. Nursing Entrance' },
  { name: 'JEMAS (PG)', desc: 'MHA · MPH · M.Sc. MLT · MAN · M.Sc. MBT · M.Phil CP/PSW' },
];

function Typewriter() {
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = TAGLINES[taglineIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && charIndex < current.length) {
      timeout = setTimeout(() => setCharIndex((c) => c + 1), 60);
    } else if (!deleting && charIndex === current.length) {
      timeout = setTimeout(() => setDeleting(true), 2000);
    } else if (deleting && charIndex > 0) {
      timeout = setTimeout(() => setCharIndex((c) => c - 1), 30);
    } else if (deleting && charIndex === 0) {
      setDeleting(false);
      setTaglineIndex((i) => (i + 1) % TAGLINES.length);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, deleting, taglineIndex]);

  return (
    <span>
      {TAGLINES[taglineIndex].slice(0, charIndex)}
      <span className="animate-pulse text-primary">|</span>
    </span>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <LogoIcon size={40} />
            </div>
            <span className="text-xl font-bold text-ink">NurseArena</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-ink-muted hover:text-ink transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-110 transition-all"
            >
              Start Practicing — Free
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="pt-32 pb-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-ink leading-tight mb-4">
              NurseArena
            </h1>
            <p className="text-xl md:text-2xl text-ink-muted max-w-3xl mx-auto mb-8 leading-relaxed min-h-[3rem]">
              <Typewriter />
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/register"
                className="bg-primary text-white px-8 py-4 rounded-xl text-base font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20"
              >
                Start Practicing — Free
              </Link>
              <a
                href="#exams"
                className="bg-surface border border-border text-ink px-8 py-4 rounded-xl text-base font-bold hover:bg-surface2 transition-all"
              >
                Explore Exams ↓
              </a>
            </div>
          </div>
        </section>

        <section id="exams" className="py-20 px-4 border-t border-border bg-surface/50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-ink text-center mb-12">Supported Exams</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map((e) => (
                <div key={e.name} className="bg-surface border border-border rounded-2xl p-6 hover:border-primary/30 transition-all">
                  <h3 className="text-lg font-bold text-ink mb-2">{e.name}</h3>
                  <p className="text-sm text-ink-muted">{e.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-ink text-center mb-12">Everything you need to crack your exam</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="bg-surface border border-border rounded-2xl p-6 text-center hover:border-primary/30 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <f.icon size={24} className="text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-ink mb-1">{f.title}</h3>
                  <p className="text-sm text-ink-muted">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 border-t border-border bg-surface/50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-ink mb-6">About</h2>
            <p className="text-ink-muted leading-relaxed mb-8">
              A comprehensive practice platform for all WBJEEB nursing and allied health entrance examinations.
              Covering JENPAS (UG), ANM & GNM, JEPBN, JEMScN, and JEMAS (PG) with real exam marking schemes,
              weekly mock tests, rapid fire mode, and subject-wise performance tracking.
            </p>
            <div className="border-t border-border pt-8">
              <p className="text-sm text-ink-muted"><strong>Developed by</strong></p>
              <p className="text-ink font-medium">Aritra Banerjee & Arijit Dey</p>
              <p className="text-xs text-ink-muted mt-4">© 2026 NurseArena. All Rights Reserved.</p>
              <p className="text-xs text-ink-muted/60 mt-1">Unauthorized copying or distribution of web app content is prohibited.</p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <Link href="/privacy" className="text-xs text-primary hover:underline">Privacy Policy</Link>
                <span className="text-ink-muted/40">·</span>
                <Link href="/contact" className="text-xs text-primary hover:underline">Contact Us</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-border text-center">
        <p className="text-xs text-ink-muted">
          © 2026 NurseArena. Developed by Aritra Banerjee & Arijit Dey. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
