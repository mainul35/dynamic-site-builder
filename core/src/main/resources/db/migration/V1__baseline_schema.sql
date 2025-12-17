-- Baseline schema migration for flashcard-app
-- This captures the current database schema before transitioning to plugin architecture

-- ========================================
-- Table: courses
-- ========================================
CREATE TABLE IF NOT EXISTS courses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(2000),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- ========================================
-- Table: modules
-- ========================================
CREATE TABLE IF NOT EXISTS modules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(2000),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_module_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_module_course ON modules(course_id);

-- ========================================
-- Table: lessons
-- ========================================
CREATE TABLE IF NOT EXISTS lessons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    module_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(2000),
    content TEXT,
    content_format VARCHAR(20) DEFAULT 'html',
    display_order INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_lesson_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lesson_module ON lessons(module_id);

-- ========================================
-- Table: media
-- ========================================
CREATE TABLE IF NOT EXISTS media (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    lesson_id BIGINT UNIQUE,
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255),
    media_type VARCHAR(50) NOT NULL,
    file_extension VARCHAR(20),
    mime_type VARCHAR(100),
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    external_url VARCHAR(1000),
    uploaded_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_media_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_media_lesson ON media(lesson_id);

-- ========================================
-- Table: decks
-- ========================================
CREATE TABLE IF NOT EXISTS decks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    module_id BIGINT,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_deck_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_deck_module ON decks(module_id);

-- ========================================
-- Table: flashcards
-- ========================================
CREATE TABLE IF NOT EXISTS flashcards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    front_content TEXT NOT NULL,
    back_content TEXT NOT NULL,
    content_format VARCHAR(20) DEFAULT 'html',
    question_type VARCHAR(20) DEFAULT 'multiple_choice',
    answer_options TEXT,
    correct_answer TEXT,
    correct_answer_explanation TEXT,
    created_at TIMESTAMP NOT NULL,
    lesson_id BIGINT,
    deck_id BIGINT,
    CONSTRAINT fk_flashcard_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    CONSTRAINT fk_flashcard_deck FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_flashcard_lesson ON flashcards(lesson_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_deck ON flashcards(deck_id);

-- ========================================
-- Table: study_sessions
-- ========================================
CREATE TABLE IF NOT EXISTS study_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    score INT NOT NULL DEFAULT 0,
    total_cards INT NOT NULL DEFAULT 0,
    module_id BIGINT,
    deck_id BIGINT,
    CONSTRAINT fk_study_session_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    CONSTRAINT fk_study_session_deck FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_study_session_module ON study_sessions(module_id);
CREATE INDEX IF NOT EXISTS idx_study_session_deck ON study_sessions(deck_id);
