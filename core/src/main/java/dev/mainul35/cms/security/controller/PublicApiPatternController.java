package dev.mainul35.cms.security.controller;

import dev.mainul35.cms.security.entity.PublicApiPattern;
import dev.mainul35.cms.security.service.PublicApiPatternService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for managing public API patterns.
 * Only accessible by administrators.
 */
@RestController
@RequestMapping("/api/admin/security/public-patterns")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class PublicApiPatternController {

    private final PublicApiPatternService patternService;

    /**
     * Get all patterns.
     */
    @GetMapping
    public ResponseEntity<List<PublicApiPattern>> getAllPatterns() {
        return ResponseEntity.ok(patternService.getAllPatterns());
    }

    /**
     * Get only enabled patterns.
     */
    @GetMapping("/enabled")
    public ResponseEntity<List<PublicApiPattern>> getEnabledPatterns() {
        return ResponseEntity.ok(patternService.getEnabledPatterns());
    }

    /**
     * Get a pattern by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<PublicApiPattern> getPattern(@PathVariable Long id) {
        return patternService.getPatternById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create a new pattern.
     */
    @PostMapping
    public ResponseEntity<?> createPattern(@RequestBody CreatePatternRequest request) {
        try {
            PublicApiPattern pattern = new PublicApiPattern(
                    request.pattern(),
                    request.httpMethods() != null ? request.httpMethods() : "GET",
                    request.description()
            );
            pattern.setEnabled(request.enabled() != null ? request.enabled() : true);

            PublicApiPattern created = patternService.createPattern(pattern);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update an existing pattern.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePattern(@PathVariable Long id, @RequestBody UpdatePatternRequest request) {
        try {
            PublicApiPattern updated = new PublicApiPattern();
            updated.setPattern(request.pattern());
            updated.setHttpMethods(request.httpMethods() != null ? request.httpMethods() : "GET");
            updated.setDescription(request.description());
            updated.setEnabled(request.enabled() != null ? request.enabled() : true);

            PublicApiPattern result = patternService.updatePattern(id, updated);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete a pattern.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePattern(@PathVariable Long id) {
        try {
            patternService.deletePattern(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Enable or disable a pattern.
     */
    @PatchMapping("/{id}/enabled")
    public ResponseEntity<?> setEnabled(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        try {
            Boolean enabled = body.get("enabled");
            if (enabled == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "enabled field is required"));
            }
            PublicApiPattern result = patternService.setEnabled(id, enabled);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Clear the cache (force reload from database).
     */
    @PostMapping("/clear-cache")
    public ResponseEntity<Map<String, String>> clearCache() {
        patternService.clearCache();
        return ResponseEntity.ok(Map.of("message", "Cache cleared successfully"));
    }

    /**
     * Test if a path would be considered public.
     */
    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> testPath(@RequestBody TestPathRequest request) {
        boolean isPublic = patternService.isPublicPath(request.path(), request.method());
        return ResponseEntity.ok(Map.of(
                "path", request.path(),
                "method", request.method(),
                "isPublic", isPublic
        ));
    }

    // Request DTOs
    public record CreatePatternRequest(
            String pattern,
            String httpMethods,
            String description,
            Boolean enabled
    ) {}

    public record UpdatePatternRequest(
            String pattern,
            String httpMethods,
            String description,
            Boolean enabled
    ) {}

    public record TestPathRequest(
            String path,
            String method
    ) {}
}
