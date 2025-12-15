package dev.mainul35.flashcardapp.service;

import dev.mainul35.flashcardapp.entity.Module;
import dev.mainul35.flashcardapp.repository.CourseRepository;
import dev.mainul35.flashcardapp.repository.LessonRepository;
import dev.mainul35.flashcardapp.repository.ModuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ModuleService {

    private final ModuleRepository moduleRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;

    @Transactional(readOnly = true)
    public List<Module> getAllModules() {
        log.info("Fetching all modules");
        return moduleRepository.findAllByOrderByDisplayOrderAsc();
    }

    @Transactional(readOnly = true)
    public List<Module> getModulesByCourseId(Long courseId) {
        log.info("Fetching modules for course: {}", courseId);
        return moduleRepository.findByCourseIdOrderByDisplayOrderAsc(courseId);
    }

    @Transactional(readOnly = true)
    public Optional<Module> getModuleById(Long id) {
        log.info("Fetching module with id: {}", id);
        return moduleRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Module> getModuleWithLessons(Long id) {
        log.info("Fetching module with lessons, id: {}", id);
        return moduleRepository.findByIdWithLessons(id);
    }

    @Transactional(readOnly = true)
    public Optional<Module> getModuleWithLessonsAndFlashcards(Long id) {
        log.info("Fetching module with lessons and flashcards, id: {}", id);
        return moduleRepository.findByIdWithLessonsAndFlashcards(id);
    }

    @Transactional
    public Module createModule(Long courseId, Module module) {
        log.info("Creating new module: {} in course: {}", module.getTitle(), courseId);

        if (module.getTitle() == null || module.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Module title cannot be empty");
        }

        return courseRepository.findById(courseId)
            .map(course -> {
                module.setCourse(course);

                if (module.getDisplayOrder() == null) {
                    module.setDisplayOrder(0);
                }

                Module savedModule = moduleRepository.save(module);
                log.info("Module created with id: {}", savedModule.getId());
                return savedModule;
            })
            .orElseThrow(() -> {
                log.error("Course not found with id: {}", courseId);
                return new RuntimeException("Course not found with id: " + courseId);
            });
    }

    @Transactional
    public Module updateModule(Long id, Module updatedModule) {
        log.info("Updating module with id: {}", id);

        return moduleRepository.findById(id)
            .map(existingModule -> {
                if (updatedModule.getTitle() != null && !updatedModule.getTitle().trim().isEmpty()) {
                    existingModule.setTitle(updatedModule.getTitle());
                }
                if (updatedModule.getDescription() != null) {
                    existingModule.setDescription(updatedModule.getDescription());
                }
                if (updatedModule.getDisplayOrder() != null) {
                    existingModule.setDisplayOrder(updatedModule.getDisplayOrder());
                }

                Module saved = moduleRepository.save(existingModule);
                log.info("Module updated: {}", saved.getId());
                return saved;
            })
            .orElseThrow(() -> {
                log.error("Module not found with id: {}", id);
                return new RuntimeException("Module not found with id: " + id);
            });
    }

    @Transactional
    public void deleteModule(Long id) {
        log.info("Deleting module with id: {}", id);

        if (!moduleRepository.existsById(id)) {
            throw new RuntimeException("Module not found with id: " + id);
        }

        moduleRepository.deleteById(id);
        log.info("Module deleted: {}", id);
    }

    @Transactional(readOnly = true)
    public long getLessonCount(Long moduleId) {
        return lessonRepository.countByModuleId(moduleId);
    }

    @Transactional(readOnly = true)
    public List<Module> searchModulesByTitle(String keyword) {
        log.info("Searching modules with keyword: {}", keyword);
        return moduleRepository.findByTitleContainingIgnoreCase(keyword);
    }
}
