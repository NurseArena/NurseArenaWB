# Admin Question Upload — CSV Format

## General Upload

Columns: `question_text, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty, subject_id, exam_id, topic`

```
question_text,option_a,option_b,option_c,option_d,correct_option,explanation,difficulty,subject_id,exam_id,topic
"What is the normal pH of blood?",7.35,7.45,7.00,7.25,a,"pH range 7.35–7.45 is normal.",medium,subj-bio-01,exam-ug-01,Blood Physiology
"Which enzyme breaks down starch?",Amylase,Lipase,Pepsin,Trypsin,a,,easy,subj-bio-01,exam-ug-01,Digestive System
```

## Subject-wise Upload

Columns: `question_text, option_a, option_b, option_c, option_d, correct_option, subject_id, explanation, difficulty, exam_id, topic`

**subject_id is required.** You can find subject IDs in the Subjects page or question bank.

```
question_text,option_a,option_b,option_c,option_d,correct_option,subject_id,explanation,difficulty,exam_id,topic
"First heart sound is caused by?",Closure of AV valves,Closure of semilunar valves,Blood entering ventricles,Atrial contraction,a,subj-ana-01,,medium,exam-ug-01,Cardiovascular
```

## Topic-wise Upload

Columns: `question_text, option_a, option_b, option_c, option_d, correct_option, topic, explanation, difficulty, subject_id, exam_id`

**topic is required.** Questions will be grouped by this topic field.

```
question_text,option_a,option_b,option_c,option_d,correct_option,topic,explanation,difficulty,subject_id,exam_id
"Sensory loss in ulnar nerve injury affects?",Ring & little finger,Thumb & index,Middle finger,Entire hand,a,Ulnar Nerve,Affects medial two fingers.,hard,subj-ana-01,exam-ug-01
```

## PYQs (Past Year Questions) Upload

Columns: `question_text, option_a, option_b, option_c, option_d, correct_option, pyq_year, explanation, difficulty, subject_id, exam_id, topic`

**pyq_year is required** and must be a 4-digit year (e.g., `2023`).

```
question_text,option_a,option_b,option_c,option_d,correct_option,pyq_year,explanation,difficulty,subject_id,exam_id,topic
"JENPAS-UG 2023: Which vitamin is fat-soluble?",Vitamin A,Vitamin C,Vitamin B12,Folic acid,a,2023,Fat-soluble vitamins: A, D, E, K.,easy,subj-bio-01,exam-ug-01,Biochemistry
```

## Rapid Fire Upload

Columns: `question_text, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty, subject_id, exam_id, topic`

Same columns as General. Marked as rapid-fire questions automatically.

```
question_text,option_a,option_b,option_c,option_d,correct_option,explanation,difficulty,subject_id,exam_id,topic
"Normal respiratory rate in adults?",12–20,20–30,30–40,40–60,a,12–20 breaths/min is normal.,easy,subj-phy-01,exam-ug-01,Respiratory
```

---

## Rules

### Required fields (all categories)
- `question_text` — the question body
- `option_a`, `option_b`, `option_c`, `option_d` — four answer choices
- `correct_option` — one of `a`, `b`, `c`, or `d` (case-insensitive)

### Optional fields
- `explanation` — shown after answering
- `difficulty` — `easy`, `medium`, or `hard` (defaults to `medium`)
- `subject_id` — links question to a subject
- `exam_id` — links question to an exam
- `topic` — topic tag for grouping

### Category-specific required fields
| Category | Extra required |
|----------|---------------|
| Subject-wise | `subject_id` |
| Topic-wise | `topic` |
| PYQs | `pyq_year` (4-digit year) |

### Notes
- CSV must have a header row matching the column names shown above.
- If a batch has more than 10% invalid rows, the entire batch is rejected.
- Values with commas must be wrapped in double quotes, e.g. `"Heart rate is 72, normal."`
- To upload, drag and drop the `.csv` file onto the upload area or click **Browse Files**.
