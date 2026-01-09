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
- **18 question topics** (Home, Cafe, Music, Swimming, etc.)
- **67 comprehensive OPIc questions** covering 5 question types (description, routine, experience, comparison, roleplay)

## Tables Created

1. `opic_levels` - 9 levels
2. `user_profiles` - Empty (populated by users)
3. `survey_selections` - Empty (populated by users)
4. `question_topics` - 18 topics
5. `questions` - 67 OPIc questions (all in English)
6. `user_question_mastery` - Empty (populated during practice)
7. `feedbacks` - Empty (populated by AI evaluation)
8. `question_weights` - Empty (calculated from mastery)

## Question Types

OPIc questions are categorized by type, not difficulty level:
- **description**: Describe a place, person, or thing
- **routine**: Explain a regular activity or process
- **experience**: Share a memorable experience or story
- **comparison**: Compare past vs present, or two different things
- **roleplay**: One-sided monologue scenarios (NOT interactive dialogue)

Note: In actual OPIc tests, roleplay questions (11-12-13) require test takers to speak everything at once - they are NOT interactive conversations with the system.

## Verification

Use Drizzle Studio to verify the data:

```bash
npm run db:studio
```

Then open http://localhost:4983 in your browser.
