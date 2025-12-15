package dev.mainul35.flashcardapp.service;

import dev.mainul35.flashcardapp.entity.Lesson;
import dev.mainul35.flashcardapp.repository.ModuleRepository;
import dev.mainul35.flashcardapp.repository.FlashCardRepository;
import dev.mainul35.flashcardapp.repository.LessonRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class LessonService {

    private final LessonRepository lessonRepository;
    private final ModuleRepository moduleRepository;
    private final FlashCardRepository flashCardRepository;

    @Transactional(readOnly = true)
    public List<Lesson> getLessonsByModuleId(Long moduleId) {
        log.info("Fetching lessons for module: {}", moduleId);
        return lessonRepository.findByModuleIdOrderByDisplayOrderAsc(moduleId);
    }

    @Transactional(readOnly = true)
    public Optional<Lesson> getLessonById(Long id) {
        log.info("Fetching lesson with id: {}", id);
        return lessonRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Lesson> getLessonWithFlashcards(Long id) {
        log.info("Fetching lesson with flashcards, id: {}", id);
        return lessonRepository.findByIdWithFlashcards(id);
    }

    @Transactional(readOnly = true)
    public Optional<Lesson> getLessonWithMedia(Long id) {
        log.info("Fetching lesson with media, id: {}", id);
        return lessonRepository.findByIdWithMedia(id);
    }

    @Transactional
    public Lesson createLesson(Long moduleId, Lesson lesson) {
        log.info("Creating new lesson in module: {}", moduleId);

        if (lesson.getTitle() == null || lesson.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Lesson title cannot be empty");
        }

        return moduleRepository.findById(moduleId)
            .map(module -> {
                lesson.setModule(module);

                if (lesson.getDisplayOrder() == null) {
                    lesson.setDisplayOrder(0);
                }
                if (lesson.getContentFormat() == null) {
                    lesson.setContentFormat("html");
                }

                Lesson savedLesson = lessonRepository.save(lesson);
                log.info("Lesson created with id: {}", savedLesson.getId());
                return savedLesson;
            })
            .orElseThrow(() -> {
                log.error("Module not found with id: {}", moduleId);
                return new RuntimeException("Module not found with id: " + moduleId);
            });
    }

    @Transactional
    public Lesson updateLesson(Long id, Lesson updatedLesson) {
        log.info("Updating lesson with id: {}", id);

        return lessonRepository.findById(id)
            .map(existingLesson -> {
                if (updatedLesson.getTitle() != null && !updatedLesson.getTitle().trim().isEmpty()) {
                    existingLesson.setTitle(updatedLesson.getTitle());
                }
                if (updatedLesson.getDescription() != null) {
                    existingLesson.setDescription(updatedLesson.getDescription());
                }
                if (updatedLesson.getContent() != null) {
                    existingLesson.setContent(updatedLesson.getContent());
                }
                if (updatedLesson.getContentFormat() != null) {
                    existingLesson.setContentFormat(updatedLesson.getContentFormat());
                }
                if (updatedLesson.getDisplayOrder() != null) {
                    existingLesson.setDisplayOrder(updatedLesson.getDisplayOrder());
                }

                Lesson saved = lessonRepository.save(existingLesson);
                log.info("Lesson updated: {}", saved.getId());
                return saved;
            })
            .orElseThrow(() -> {
                log.error("Lesson not found with id: {}", id);
                return new RuntimeException("Lesson not found with id: " + id);
            });
    }

    @Transactional
    public void deleteLesson(Long id) {
        log.info("Deleting lesson with id: {}", id);

        if (!lessonRepository.existsById(id)) {
            throw new RuntimeException("Lesson not found with id: " + id);
        }

        lessonRepository.deleteById(id);
        log.info("Lesson deleted: {}", id);
    }

    @Transactional(readOnly = true)
    public long getFlashcardCount(Long lessonId) {
        return flashCardRepository.countByLessonId(lessonId);
    }

    @Transactional(readOnly = true)
    public List<Lesson> searchLessonsByTitle(String keyword) {
        log.info("Searching lessons with keyword: {}", keyword);
        return lessonRepository.findByTitleContainingIgnoreCase(keyword);
    }

    @Transactional
    public Lesson updateLessonOrder(Long id, Integer newOrder) {
        log.info("Updating display order for lesson: {} to {}", id, newOrder);

        return lessonRepository.findById(id)
            .map(lesson -> {
                lesson.setDisplayOrder(newOrder);
                return lessonRepository.save(lesson);
            })
            .orElseThrow(() -> new RuntimeException("Lesson not found with id: " + id));
    }
}
