-- Only used if you set: spring.jpa.hibernate.ddl-auto=none
-- and spring.sql.init.mode=always

CREATE TABLE IF NOT EXISTS decks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flashcards (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    front_content VARCHAR(2000) NOT NULL,
    back_content VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    deck_id BIGINT NOT NULL,
    FOREIGN KEY (deck_id) REFERENCES decks(id)
);

CREATE TABLE IF NOT EXISTS study_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    score INT NOT NULL,
    total_cards INT NOT NULL,
    deck_id BIGINT NOT NULL,
    FOREIGN KEY (deck_id) REFERENCES decks(id)
);