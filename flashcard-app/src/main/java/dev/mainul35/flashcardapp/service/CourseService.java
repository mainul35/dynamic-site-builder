package dev.mainul35.flashcardapp.service;

import dev.mainul35.flashcardapp.entity.Course;
import dev.mainul35.flashcardapp.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseService {

    private final CourseRepository courseRepository;

    /**
     * Get all courses ordered by display order
     */
    public List<Course> getAllCourses() {
        log.debug("Fetching all courses");
        return courseRepository.findAllByOrderByDisplayOrderAsc();
    }

    /**
     * Get course by ID
     */
    public Optional<Course> getCourseById(Long id) {
        log.debug("Fetching course with id: {}", id);
        return courseRepository.findById(id);
    }

    /**
     * Get course by ID with modules eagerly loaded
     */
    public Optional<Course> getCourseWithModules(Long id) {
        log.debug("Fetching course with modules, id: {}", id);
        return courseRepository.findByIdWithModules(id);
    }

    /**
     * Get course by ID with modules and lessons eagerly loaded
     */
    public Optional<Course> getCourseWithModulesAndLessons(Long id) {
        log.debug("Fetching course with modules and lessons, id: {}", id);
        return courseRepository.findByIdWithModulesAndLessons(id);
    }

    /**
     * Create a new course
     */
    @Transactional
    public Course createCourse(Course course) {
        log.debug("Creating new course: {}", course.getTitle());

        if (course.getDisplayOrder() == null) {
            course.setDisplayOrder(0);
        }

        Course savedCourse = courseRepository.save(course);
        log.info("Course created with id: {}", savedCourse.getId());

        return savedCourse;
    }

    /**
     * Update an existing course
     */
    @Transactional
    public Course updateCourse(Long id, Course courseDetails) {
        log.debug("Updating course with id: {}", id);

        return courseRepository.findById(id)
                .map(existingCourse -> {
                    existingCourse.setTitle(courseDetails.getTitle());
                    existingCourse.setDescription(courseDetails.getDescription());

                    if (courseDetails.getDisplayOrder() != null) {
                        existingCourse.setDisplayOrder(courseDetails.getDisplayOrder());
                    }

                    Course updated = courseRepository.save(existingCourse);
                    log.info("Course updated: {}", updated.getId());
                    return updated;
                })
                .orElseThrow(() -> {
                    log.error("Course not found with id: {}", id);
                    return new RuntimeException("Course not found with id: " + id);
                });
    }

    /**
     * Delete a course by ID
     */
    @Transactional
    public void deleteCourse(Long id) {
        log.debug("Deleting course with id: {}", id);

        if (!courseRepository.existsById(id)) {
            log.error("Course not found with id: {}", id);
            throw new RuntimeException("Course not found with id: " + id);
        }

        courseRepository.deleteById(id);
        log.info("Course deleted: {}", id);
    }

    /**
     * Search courses by title
     */
    public List<Course> searchCoursesByTitle(String keyword) {
        log.debug("Searching courses by title: {}", keyword);
        return courseRepository.findByTitleContainingIgnoreCase(keyword);
    }
}
