# Database Setup Guide

## 1. Push Schema to Supabase

```bash
npm run db:push
```

This will create all 8 tables in your Supabase database.

## 2. Seed Initial Data

```bash
npm run db:seed
```

This will populate:
- **9 OPIc levels** (NL to AL)
- **18 question topics** (집, 카페, 음악, 수영, etc.)
- **4 sample questions** (카페 경험, 집 묘사, 수영 루틴, 카페 롤플레이)

## Tables Created

1. `opic_levels` - 9 levels
2. `user_profiles` - Empty (populated by users)
3. `survey_selections` - Empty (populated by users)
4. `question_topics` - 18 topics
5. `questions` - 4 sample questions
6. `user_question_mastery` - Empty (populated during practice)
7. `feedbacks` - Empty (populated by AI evaluation)
8. `question_weights` - Empty (calculated from mastery)

## Verification

Use Drizzle Studio to verify the data:

```bash
npm run db:studio
```

Then open http://localhost:4983 in your browser.
