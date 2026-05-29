export interface ScoringProfile {
  id: string;
  name: string;
  marks_correct: number;
  marks_wrong: number;
  marks_unattempted: number;
  partial_credit: boolean;
}

export function calculateMarks(
  isCorrect: boolean | null,
  profile: Pick<ScoringProfile, 'marks_correct' | 'marks_wrong' | 'marks_unattempted'>
): number {
  if (isCorrect === null) return -profile.marks_unattempted;
  if (isCorrect) return profile.marks_correct;
  return -profile.marks_wrong;
}

export function calculateSessionScore(
  answers: Array<{ is_correct: boolean | null }>,
  profile: Pick<ScoringProfile, 'marks_correct' | 'marks_wrong' | 'marks_unattempted'>
): { score: number; correct: number; wrong: number; skipped: number } {
  let score = 0, correct = 0, wrong = 0, skipped = 0;
  for (const a of answers) {
    score += calculateMarks(a.is_correct, profile);
    if (a.is_correct === null) skipped++;
    else if (a.is_correct) correct++;
    else wrong++;
  }
  return { score: Math.max(0, score), correct, wrong, skipped };
}
