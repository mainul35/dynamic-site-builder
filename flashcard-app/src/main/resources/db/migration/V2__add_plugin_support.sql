-- Add plugin support to existing tables
-- This migration prepares the schema for the plugin architecture

-- ========================================
-- Add plugin_id columns to existing tables
-- ========================================

-- Courses belong to course-plugin
ALTER TABLE courses ADD COLUMN plugin_id VARCHAR(100) DEFAULT 'course-plugin';
UPDATE courses SET plugin_id = 'course-plugin' WHERE plugin_id IS NULL;
ALTER TABLE courses ALTER COLUMN plugin_id SET NOT NULL;

-- Modules belong to course-plugin
ALTER TABLE modules ADD COLUMN plugin_id VARCHAR(100) DEFAULT 'course-plugin';
UPDATE modules SET plugin_id = 'course-plugin' WHERE plugin_id IS NULL;
ALTER TABLE modules ALTER COLUMN plugin_id SET NOT NULL;

-- Lessons belong to lesson-plugin
ALTER TABLE lessons ADD COLUMN plugin_id VARCHAR(100) DEFAULT 'lesson-plugin';
UPDATE lessons SET plugin_id = 'lesson-plugin' WHERE plugin_id IS NULL;
ALTER TABLE lessons ALTER COLUMN plugin_id SET NOT NULL;

-- Media files belong to media-plugin
ALTER TABLE media ADD COLUMN plugin_id VARCHAR(100) DEFAULT 'media-plugin';
UPDATE media SET plugin_id = 'media-plugin' WHERE plugin_id IS NULL;
ALTER TABLE media ALTER COLUMN plugin_id SET NOT NULL;

-- Decks belong to flashcard-plugin
ALTER TABLE decks ADD COLUMN plugin_id VARCHAR(100) DEFAULT 'flashcard-plugin';
UPDATE decks SET plugin_id = 'flashcard-plugin' WHERE plugin_id IS NULL;
ALTER TABLE decks ALTER COLUMN plugin_id SET NOT NULL;

-- Flashcards belong to flashcard-plugin
ALTER TABLE flashcards ADD COLUMN plugin_id VARCHAR(100) DEFAULT 'flashcard-plugin';
UPDATE flashcards SET plugin_id = 'flashcard-plugin' WHERE plugin_id IS NULL;
ALTER TABLE flashcards ALTER COLUMN plugin_id SET NOT NULL;

-- Study sessions belong to flashcard-plugin
ALTER TABLE study_sessions ADD COLUMN plugin_id VARCHAR(100) DEFAULT 'flashcard-plugin';
UPDATE study_sessions SET plugin_id = 'flashcard-plugin' WHERE plugin_id IS NULL;
ALTER TABLE study_sessions ALTER COLUMN plugin_id SET NOT NULL;

-- ========================================
-- Rename tables with plugin prefix
-- ========================================

ALTER TABLE courses RENAME TO plugin_course_courses;
ALTER TABLE modules RENAME TO plugin_course_modules;
ALTER TABLE lessons RENAME TO plugin_lesson_lessons;
ALTER TABLE media RENAME TO plugin_media_files;
ALTER TABLE decks RENAME TO plugin_flashcard_decks;
ALTER TABLE flashcards RENAME TO plugin_flashcard_cards;
ALTER TABLE study_sessions RENAME TO plugin_flashcard_study_sessions;

-- ========================================
-- Add indexes on plugin_id columns
-- ========================================

CREATE INDEX IF NOT EXISTS idx_course_plugin ON plugin_course_courses(plugin_id);
CREATE INDEX IF NOT EXISTS idx_module_plugin ON plugin_course_modules(plugin_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plugin ON plugin_lesson_lessons(plugin_id);
CREATE INDEX IF NOT EXISTS idx_media_plugin ON plugin_media_files(plugin_id);
CREATE INDEX IF NOT EXISTS idx_deck_plugin ON plugin_flashcard_decks(plugin_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_plugin ON plugin_flashcard_cards(plugin_id);
CREATE INDEX IF NOT EXISTS idx_study_session_plugin ON plugin_flashcard_study_sessions(plugin_id);
