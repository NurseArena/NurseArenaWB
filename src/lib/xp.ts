export const RAPID_FIRE_TIERS = [
  { tier: 1, name: 'Starter', marksMilestone: 0, timerSeconds: 15 },
  { tier: 2, name: 'Speed Seeker', marksMilestone: 200, timerSeconds: 10 },
  { tier: 3, name: 'Fast Track', marksMilestone: 600, timerSeconds: 7 },
  { tier: 4, name: 'Lightning', marksMilestone: 1500, timerSeconds: 5 },
  { tier: 5, name: 'Storm', marksMilestone: 3500, timerSeconds: 3 },
] as const;

export function getRapidFireTier(totalMarksEarned: number) {
  let unlockedTier = 1;
  for (const t of RAPID_FIRE_TIERS) {
    if (totalMarksEarned >= t.marksMilestone) {
      unlockedTier = t.tier;
    }
  }
  return RAPID_FIRE_TIERS[unlockedTier - 1];
}

export function getNextTier(totalMarksEarned: number) {
  const current = getRapidFireTier(totalMarksEarned);
  const next = RAPID_FIRE_TIERS.find(t => t.marksMilestone > totalMarksEarned);
  return next ?? null;
}

export function marksToXp(marks: number): number {
  return Math.floor(marks * 10);
}

export const MARKS_ACTIONS = {
  CAT_I_CORRECT: 1.0,
  CAT_I_WRONG: -0.25,
  CAT_II_FULL: 2.0,
  CAT_II_PARTIAL_RATIO: 0, // computed as selected/correct ratio * 2
} as const;

export function calculateMarks(
  responses: { selected: string | string[] | null; category: 'I' | 'II' }[],
  questions: { category: 'I' | 'II'; correctAnswers: string[] }[]
) {
  let totalMarks = 0;
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  let negativePenalty = 0;
  let catICorrect = 0;
  let catIWrong = 0;
  let catISkip = 0;
  let catIICorrect = 0;
  let catIIWrong = 0;
  let catIIPartial = 0;
  let catIISkip = 0;

  responses.forEach((resp, i) => {
    const q = questions[i];
    if (!q) return;

    if (q.category === 'I') {
      if (resp.selected === null || resp.selected === '') {
        skipped++;
        catISkip++;
      } else if (resp.selected === q.correctAnswers[0]) {
        totalMarks += 1.0;
        correct++;
        catICorrect++;
      } else {
        totalMarks -= 0.25;
        wrong++;
        catIWrong++;
        negativePenalty += 0.25;
      }
    }

    if (q.category === 'II') {
      const selected = resp.selected as string[] | null;
      if (!selected || selected.length === 0) {
        skipped++;
        catIISkip++;
      } else {
        const hasWrong = selected.some(s => !q.correctAnswers.includes(s));
        if (hasWrong) {
          wrong++;
          catIIWrong++;
        } else {
          const partialRatio = selected.length / q.correctAnswers.length;
          const pts = 2 * partialRatio;
          totalMarks += pts;
          correct++;
          if (partialRatio < 1) {
            catIIPartial++;
          } else {
            catIICorrect++;
          }
        }
      }
    }
  });

  return {
    marksEarned: Math.round(totalMarks * 100) / 100,
    totalMarks: questions.length,
    correct,
    wrong,
    skipped,
    negativePenalty: Math.round(negativePenalty * 100) / 100,
    categoryIAttempts: { correct: catICorrect, wrong: catIWrong, skip: catISkip },
    categoryIIAttempts: { correct: catIICorrect, wrong: catIIWrong, partial: catIIPartial, skip: catIISkip },
  };
}
