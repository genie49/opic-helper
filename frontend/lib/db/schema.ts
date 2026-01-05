import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  serial,
  jsonb,
  decimal,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. OPIc Levels (마스터 테이블)
export const opicLevels = pgTable("opic_levels", {
  id: serial("id").primaryKey(),
  levelCode: varchar("level_code", { length: 10 }).notNull().unique(),
  levelName: varchar("level_name", { length: 50 }).notNull(),
  levelOrder: integer("level_order").notNull().unique(),
  minUtterance: integer("min_utterance"),
  minWords: integer("min_words"),
  minConnectors: integer("min_connectors"),
  minModifiers: integer("min_modifiers"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 2. User Profiles
export const userProfiles = pgTable(
  "user_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(), // FK to auth.users
    currentLevelId: integer("current_level_id").references(() => opicLevels.id),
    targetLevelId: integer("target_level_id").references(() => opicLevels.id),
    displayName: varchar("display_name", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    uniqueUser: uniqueIndex("unique_user").on(table.userId),
  })
);

// 3. Survey Selections
export const surveySelections = pgTable(
  "survey_selections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(), // FK to auth.users
    category: varchar("category", { length: 50 }).notNull(),
    selection: varchar("selection", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdx: index("idx_survey_user").on(table.userId),
    uniqueUserCategorySelection: uniqueIndex("unique_user_category_selection").on(
      table.userId,
      table.category,
      table.selection
    ),
  })
);

// 4. Question Topics
export const questionTopics = pgTable("question_topics", {
  id: serial("id").primaryKey(),
  topicName: varchar("topic_name", { length: 50 }).notNull().unique(),
  category: varchar("category", { length: 50 }).notNull(),
  description: text("description"),
  isCommonTopic: boolean("is_common_topic").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 5. Questions
export const questions = pgTable(
  "questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    topicId: integer("topic_id")
      .notNull()
      .references(() => questionTopics.id),
    questionType: varchar("question_type", { length: 50 }).notNull(),
    difficultyLevel: varchar("difficulty_level", { length: 10 }).notNull(),
    questionText: text("question_text").notNull(),
    expectedAnswerStructure: text("expected_answer_structure"),
    keyVocabulary: text("key_vocabulary").array(),
    roleplayContext: jsonb("roleplay_context"),
    createdBy: varchar("created_by", { length: 20 }).default("admin"),
    isAiGenerated: boolean("is_ai_generated").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    topicIdx: index("idx_questions_topic").on(table.topicId),
    typeIdx: index("idx_questions_type").on(table.questionType),
    difficultyIdx: index("idx_questions_difficulty").on(table.difficultyLevel),
    aiGeneratedIdx: index("idx_questions_ai_generated").on(table.isAiGenerated),
  })
);

// 6. User Question Mastery
export const userQuestionMastery = pgTable(
  "user_question_mastery",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(), // FK to auth.users
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    masteryLevel: integer("mastery_level").default(0),
    attemptCount: integer("attempt_count").default(0),
    lastScore: integer("last_score"),
    lastAttemptedAt: timestamp("last_attempted_at", { withTimezone: true }),
    isWeakTopic: boolean("is_weak_topic").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdx: index("idx_mastery_user").on(table.userId),
    weakIdx: index("idx_mastery_weak").on(table.userId, table.isWeakTopic),
    levelIdx: index("idx_mastery_level").on(table.userId, table.masteryLevel),
    uniqueUserQuestion: uniqueIndex("unique_user_question").on(
      table.userId,
      table.questionId
    ),
  })
);

// 7. Feedbacks
export const feedbacks = pgTable(
  "feedbacks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(), // FK to auth.users
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id),
    answerText: text("answer_text").notNull(),
    evaluatedLevel: varchar("evaluated_level", { length: 10 }),
    scores: jsonb("scores").notNull(),
    feedback: jsonb("feedback").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdx: index("idx_feedbacks_user").on(table.userId),
    createdIdx: index("idx_feedbacks_created").on(table.createdAt),
  })
);

// 8. Question Weights
export const questionWeights = pgTable(
  "question_weights",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(), // FK to auth.users
    topicName: varchar("topic_name", { length: 50 }).notNull(),
    questionType: varchar("question_type", { length: 50 }).notNull(),
    weight: decimal("weight", { precision: 5, scale: 2 }).default("1.0"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdx: index("idx_weights_user").on(table.userId),
    uniqueUserTopicType: uniqueIndex("unique_user_topic_type").on(
      table.userId,
      table.topicName,
      table.questionType
    ),
  })
);

// Relations
export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  currentLevel: one(opicLevels, {
    fields: [userProfiles.currentLevelId],
    references: [opicLevels.id],
    relationName: "currentLevel",
  }),
  targetLevel: one(opicLevels, {
    fields: [userProfiles.targetLevelId],
    references: [opicLevels.id],
    relationName: "targetLevel",
  }),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  topic: one(questionTopics, {
    fields: [questions.topicId],
    references: [questionTopics.id],
  }),
}));

export const userQuestionMasteryRelations = relations(
  userQuestionMastery,
  ({ one }) => ({
    question: one(questions, {
      fields: [userQuestionMastery.questionId],
      references: [questions.id],
    }),
  })
);

export const feedbacksRelations = relations(feedbacks, ({ one }) => ({
  question: one(questions, {
    fields: [feedbacks.questionId],
    references: [questions.id],
  }),
}));
