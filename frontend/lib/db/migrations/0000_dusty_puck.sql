CREATE TABLE "feedbacks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"answer_text" text NOT NULL,
	"evaluated_level" varchar(10),
	"scores" jsonb NOT NULL,
	"feedback" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "opic_levels" (
	"id" serial PRIMARY KEY NOT NULL,
	"level_code" varchar(10) NOT NULL,
	"level_name" varchar(50) NOT NULL,
	"level_order" integer NOT NULL,
	"min_utterance" integer,
	"min_words" integer,
	"min_connectors" integer,
	"min_modifiers" integer,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "opic_levels_level_code_unique" UNIQUE("level_code"),
	CONSTRAINT "opic_levels_level_order_unique" UNIQUE("level_order")
);
--> statement-breakpoint
CREATE TABLE "question_topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic_name" varchar(50) NOT NULL,
	"category" varchar(50) NOT NULL,
	"description" text,
	"is_common_topic" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "question_topics_topic_name_unique" UNIQUE("topic_name")
);
--> statement-breakpoint
CREATE TABLE "question_weights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic_name" varchar(50) NOT NULL,
	"question_type" varchar(50) NOT NULL,
	"weight" numeric(5, 2) DEFAULT '1.0',
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" integer NOT NULL,
	"question_type" varchar(50) NOT NULL,
	"difficulty_level" varchar(10) NOT NULL,
	"question_text" text NOT NULL,
	"expected_answer_structure" text,
	"key_vocabulary" text[],
	"roleplay_context" jsonb,
	"created_by" varchar(20) DEFAULT 'admin',
	"is_ai_generated" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "survey_selections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category" varchar(50) NOT NULL,
	"selection" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"current_level_id" integer,
	"target_level_id" integer,
	"display_name" varchar(100),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_question_mastery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"mastery_level" integer DEFAULT 0,
	"attempt_count" integer DEFAULT 0,
	"last_score" integer,
	"last_attempted_at" timestamp with time zone,
	"is_weak_topic" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_topic_id_question_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."question_topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_current_level_id_opic_levels_id_fk" FOREIGN KEY ("current_level_id") REFERENCES "public"."opic_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_target_level_id_opic_levels_id_fk" FOREIGN KEY ("target_level_id") REFERENCES "public"."opic_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_question_mastery" ADD CONSTRAINT "user_question_mastery_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_feedbacks_user" ON "feedbacks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_feedbacks_created" ON "feedbacks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_weights_user" ON "question_weights" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_topic_type" ON "question_weights" USING btree ("user_id","topic_name","question_type");--> statement-breakpoint
CREATE INDEX "idx_questions_topic" ON "questions" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "idx_questions_type" ON "questions" USING btree ("question_type");--> statement-breakpoint
CREATE INDEX "idx_questions_difficulty" ON "questions" USING btree ("difficulty_level");--> statement-breakpoint
CREATE INDEX "idx_questions_ai_generated" ON "questions" USING btree ("is_ai_generated");--> statement-breakpoint
CREATE INDEX "idx_survey_user" ON "survey_selections" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_category_selection" ON "survey_selections" USING btree ("user_id","category","selection");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user" ON "user_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_mastery_user" ON "user_question_mastery" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_mastery_weak" ON "user_question_mastery" USING btree ("user_id","is_weak_topic");--> statement-breakpoint
CREATE INDEX "idx_mastery_level" ON "user_question_mastery" USING btree ("user_id","mastery_level");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_question" ON "user_question_mastery" USING btree ("user_id","question_id");