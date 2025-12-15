package dev.mainul35.flashcardapp.controller;

import dev.mainul35.flashcardapp.entity.Module;
import dev.mainul35.flashcardapp.service.ModuleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses/{courseId}/modules")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class ModuleController {

    private final ModuleService moduleService;

    /**
     * Get all modules in a course
     */
    @GetMapping
    public ResponseEntity<List<Module>> getModulesByCourseId(@PathVariable Long courseId) {
        try {
            List<Module> modules = moduleService.getModulesByCourseId(courseId);
            return ResponseEntity.ok(modules);
        } catch (Exception e) {
            log.error("Error fetching modules for course: {}", courseId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get module by ID
     */
    @GetMapping("/{moduleId}")
    public ResponseEntity<Module> getModuleById(
            @PathVariable Long courseId,
            @PathVariable Long moduleId) {
        try {
            return moduleService.getModuleById(moduleId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error fetching module with id: {}", moduleId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get module by ID with lessons
     */
    @GetMapping("/{moduleId}/with-lessons")
    public ResponseEntity<Module> getModuleWithLessons(
            @PathVariable Long courseId,
            @PathVariable Long moduleId) {
        try {
            return moduleService.getModuleWithLessons(moduleId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error fetching module with lessons, id: {}", moduleId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get module by ID with lessons and flashcards
     */
    @GetMapping("/{moduleId}/with-lessons-and-flashcards")
    public ResponseEntity<Module> getModuleWithLessonsAndFlashcards(
            @PathVariable Long courseId,
            @PathVariable Long moduleId) {
        try {
            return moduleService.getModuleWithLessonsAndFlashcards(moduleId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error fetching module with lessons and flashcards, id: {}", moduleId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Create a new module
     */
    @PostMapping
    public ResponseEntity<Module> createModule(
            @PathVariable Long courseId,
            @RequestBody Module module) {
        try {
            Module createdModule = moduleService.createModule(courseId, module);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdModule);
        } catch (IllegalArgumentException e) {
            log.error("Validation error creating module", e);
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Course not found")) {
                return ResponseEntity.notFound().build();
            }
            log.error("Error creating module in course: {}", courseId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Update a module
     */
    @PutMapping("/{moduleId}")
    public ResponseEntity<Module> updateModule(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @RequestBody Module module) {
        try {
            Module updatedModule = moduleService.updateModule(moduleId, module);
            return ResponseEntity.ok(updatedModule);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            log.error("Error updating module with id: {}", moduleId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete a module
     */
    @DeleteMapping("/{moduleId}")
    public ResponseEntity<Void> deleteModule(
            @PathVariable Long courseId,
            @PathVariable Long moduleId) {
        try {
            moduleService.deleteModule(moduleId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            log.error("Error deleting module with id: {}", moduleId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Search modules by title
     */
    @GetMapping("/search")
    public ResponseEntity<List<Module>> searchModules(@RequestParam String keyword) {
        try {
            List<Module> modules = moduleService.searchModulesByTitle(keyword);
            return ResponseEntity.ok(modules);
        } catch (Exception e) {
            log.error("Error searching modules with keyword: {}", keyword, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get lesson count for a module
     */
    @GetMapping("/{moduleId}/lesson-count")
    public ResponseEntity<Long> getLessonCount(
            @PathVariable Long courseId,
            @PathVariable Long moduleId) {
        try {
            long count = moduleService.getLessonCount(moduleId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            log.error("Error getting lesson count for module: {}", moduleId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
