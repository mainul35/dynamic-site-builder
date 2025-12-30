package dev.mainul35.cms.sitebuilder.controller;

import dev.mainul35.cms.sitebuilder.dto.ContentItem;
import dev.mainul35.cms.sitebuilder.service.ContentRepositoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * REST controller for content repository operations.
 * Provides endpoints for uploading, listing, and managing media files.
 */
@RestController
@RequestMapping("/api/content")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class ContentRepositoryController {

    private final ContentRepositoryService contentRepositoryService;

    /**
     * Upload a new file to the repository
     *
     * @param file The file to upload
     * @param folder Optional folder path
     * @return The created content item
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ContentItem> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", required = false, defaultValue = "") String folder) {
        try {
            log.info("Uploading file: {} to folder: {}", file.getOriginalFilename(), folder);
            ContentItem item = contentRepositoryService.uploadFile(file, folder);
            return ResponseEntity.status(HttpStatus.CREATED).body(item);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid file upload: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error uploading file: {}", file.getOriginalFilename(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all content items, optionally filtered by type
     *
     * @param type Optional content type filter (image, video, pdf, other)
     * @param folder Optional folder path filter
     * @return List of content items
     */
    @GetMapping
    public ResponseEntity<List<ContentItem>> getAllContent(
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "folder", required = false) String folder) {
        try {
            log.debug("Fetching content items, type: {}, folder: {}", type, folder);
            List<ContentItem> items = contentRepositoryService.getContentItems(type, folder);
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            log.error("Error fetching content items", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get images only
     *
     * @return List of image content items
     */
    @GetMapping("/images")
    public ResponseEntity<List<ContentItem>> getImages() {
        try {
            log.debug("Fetching images");
            List<ContentItem> items = contentRepositoryService.getContentItems("image", null);
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            log.error("Error fetching images", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get a specific content item by ID
     *
     * @param id Content item ID
     * @return The content item
     */
    @GetMapping("/{id}")
    public ResponseEntity<ContentItem> getContentItem(@PathVariable String id) {
        try {
            return contentRepositoryService.getContentItem(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error fetching content item: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete a content item
     *
     * @param id Content item ID
     * @return Success status
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContentItem(@PathVariable String id) {
        try {
            log.info("Deleting content item: {}", id);
            boolean deleted = contentRepositoryService.deleteContentItem(id);
            if (deleted) {
                return ResponseEntity.noContent().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error deleting content item: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get repository statistics
     *
     * @return Map of statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        try {
            Map<String, Object> stats = contentRepositoryService.getStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error fetching stats", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Create a new folder
     *
     * @param folderPath The folder path to create
     * @return Success status
     */
    @PostMapping("/folders")
    public ResponseEntity<Void> createFolder(@RequestParam("path") String folderPath) {
        try {
            log.info("Creating folder: {}", folderPath);
            contentRepositoryService.createFolder(folderPath);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creating folder: {}", folderPath, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all folders
     *
     * @return List of folder paths
     */
    @GetMapping("/folders")
    public ResponseEntity<List<String>> getFolders() {
        try {
            List<String> folders = contentRepositoryService.getFolders();
            return ResponseEntity.ok(folders);
        } catch (Exception e) {
            log.error("Error fetching folders", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
