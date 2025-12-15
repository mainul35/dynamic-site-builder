package dev.mainul35.flashcardapp.controller;

import dev.mainul35.flashcardapp.entity.Lesson;
import dev.mainul35.flashcardapp.service.LessonService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses/{courseId}/modules/{moduleId}/lessons")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class LessonController {

    private final LessonService lessonService;

    @GetMapping
    public ResponseEntity<List<Lesson>> getLessonsByModuleId(
            @PathVariable Long courseId,
            @PathVariable Long moduleId) {
        try {
            List<Lesson> lessons = lessonService.getLessonsByModuleId(moduleId);
            return ResponseEntity.ok(lessons);
        } catch (Exception e) {
            log.error("Error fetching lessons for module: {}", moduleId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{lessonId}")
    public ResponseEntity<Lesson> getLessonById(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long lessonId) {
        try {
            return lessonService.getLessonById(lessonId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error fetching lesson with id: {}", lessonId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{lessonId}/with-flashcards")
    public ResponseEntity<Lesson> getLessonWithFlashcards(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long lessonId) {
        try {
            return lessonService.getLessonWithFlashcards(lessonId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error fetching lesson with flashcards, id: {}", lessonId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{lessonId}/with-media")
    public ResponseEntity<Lesson> getLessonWithMedia(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long lessonId) {
        try {
            return lessonService.getLessonWithMedia(lessonId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error fetching lesson with media, id: {}", lessonId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<Lesson> createLesson(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @RequestBody Lesson lesson) {
        try {
            Lesson createdLesson = lessonService.createLesson(moduleId, lesson);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdLesson);
        } catch (IllegalArgumentException e) {
            log.error("Validation error creating lesson", e);
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            log.error("Error creating lesson in module: {}", moduleId, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error creating lesson", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{lessonId}")
    public ResponseEntity<Lesson> updateLesson(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long lessonId,
            @RequestBody Lesson lesson) {
        try {
            Lesson updatedLesson = lessonService.updateLesson(lessonId, lesson);
            return ResponseEntity.ok(updatedLesson);
        } catch (IllegalArgumentException e) {
            log.error("Validation error updating lesson", e);
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            log.error("Error updating lesson with id: {}", lessonId, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error updating lesson", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{lessonId}")
    public ResponseEntity<Void> deleteLesson(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long lessonId) {
        try {
            lessonService.deleteLesson(lessonId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting lesson with id: {}", lessonId, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error deleting lesson", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PatchMapping("/{lessonId}/order")
    public ResponseEntity<Lesson> updateLessonOrder(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long lessonId,
            @RequestBody Integer displayOrder) {
        try {
            Lesson updatedLesson = lessonService.updateLessonOrder(lessonId, displayOrder);
            return ResponseEntity.ok(updatedLesson);
        } catch (RuntimeException e) {
            log.error("Error updating lesson order with id: {}", lessonId, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error updating lesson order", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
