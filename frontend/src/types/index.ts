export interface Deck {
  id?: number;
  moduleId?: number;
  title: string;
  description: string;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type QuestionType = 'multiple_choice' | 'true_false';

export interface Flashcard {
  id?: number;
  frontContent: string;
  backContent: string;
  deckId?: number;
  questionType?: QuestionType;
  answerOptions?: string; // JSON string array
  correctAnswer?: string; // JSON string or value
  correctAnswerExplanation?: string; // Explanation shown when incorrect
  createdAt?: string;
  updatedAt?: string;
  // Aliases for backward compatibility
  question?: string;
  answer?: string;
}

export interface StudySession {
  id?: number;
  deckId: number;
  score: number;
  totalCards: number;
  completedAt?: string;
  createdAt?: string;
}

export interface CreateDeckRequest {
  title: string;
  description: string;
  displayOrder?: number;
}

export interface CreateFlashcardRequest {
  frontContent: string;
  backContent: string;
  questionType?: QuestionType;
  answerOptions?: string;
  correctAnswer?: string;
  correctAnswerExplanation?: string;
}

// Course-related types
export interface Course {
  id?: number;
  title: string;
  description: string;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  modules?: Module[];
}

export interface CreateCourseRequest {
  title: string;
  description: string;
  displayOrder?: number;
}

// Module-related types (renamed from Chapter)
export interface Module {
  id?: number;
  courseId?: number;
  title: string;
  description: string;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  lessons?: Lesson[];
  deckId?: number;  // Optional link to quiz deck
}

export interface CreateModuleRequest {
  title: string;
  description: string;
  displayOrder?: number;
}

// Lesson-related types
export interface Lesson {
  id?: number;
  moduleId?: number;
  title: string;
  description: string;
  content: string;
  contentFormat?: string;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  flashcards?: Flashcard[];
  media?: Media;  // Single media, was mediaFiles array
}

export interface CreateLessonRequest {
  title: string;
  description: string;
  content: string;
  contentFormat?: string;
  displayOrder?: number;
}

// Media-related types
export interface Media {
  id?: number;
  fileName: string;
  originalFileName?: string;
  mediaType: string;
  fileExtension?: string;
  mimeType?: string;
  filePath: string;
  fileSize?: number;
  externalUrl?: string;
  uploadedAt?: string;
}

// Unified content item for lessons and quizzes in modules
export type ModuleContentType = 'lesson' | 'quiz';

export interface ModuleContentItem {
  id: string; // Combined ID like "lesson-123" or "quiz-456"
  type: ModuleContentType;
  title: string;
  description: string;
  displayOrder: number;
  data: Lesson | Deck; // Original data
}

// Re-export builder and site types
export * from './builder';
export * from './site';
