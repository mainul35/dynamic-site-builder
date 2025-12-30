package dev.mainul35.cms.sitebuilder.service;

import dev.mainul35.cms.sitebuilder.dto.ContentItem;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Service for managing content repository operations.
 * Handles file uploads, storage, and retrieval.
 */
@Service
@Slf4j
public class ContentRepositoryService {

    @Value("${app.content.upload-dir:uploads}")
    private String uploadDir;

    @Value("${app.content.base-url:/uploads}")
    private String baseUrl;

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"
    );

    private static final Set<String> ALLOWED_VIDEO_TYPES = Set.of(
            "video/mp4", "video/webm", "video/ogg"
    );

    private static final Set<String> ALLOWED_DOCUMENT_TYPES = Set.of(
            "application/pdf", "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    /**
     * Upload a file to the repository
     */
    public ContentItem uploadFile(MultipartFile file, String folder) throws IOException {
        // Validate file
        validateFile(file);

        // Create upload directory if it doesn't exist
        Path uploadPath = getUploadPath(folder);
        Files.createDirectories(uploadPath);

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String uniqueId = UUID.randomUUID().toString();
        String newFilename = uniqueId + extension;

        // Save file
        Path filePath = uploadPath.resolve(newFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        log.info("File uploaded: {} -> {}", originalFilename, filePath);

        // Determine content type
        String mimeType = file.getContentType();
        String type = determineContentType(mimeType);

        // Get image dimensions if applicable
        int width = 0;
        int height = 0;
        if ("image".equals(type) && !mimeType.equals("image/svg+xml")) {
            try {
                BufferedImage image = ImageIO.read(filePath.toFile());
                if (image != null) {
                    width = image.getWidth();
                    height = image.getHeight();
                }
            } catch (Exception e) {
                log.warn("Could not read image dimensions: {}", e.getMessage());
            }
        }

        // Build URL
        String fileUrl = buildFileUrl(folder, newFilename);

        return ContentItem.builder()
                .id(uniqueId)
                .name(newFilename)
                .originalName(originalFilename)
                .type(type)
                .mimeType(mimeType)
                .size(file.getSize())
                .url(fileUrl)
                .thumbnailUrl(fileUrl) // For now, use same URL
                .folder(folder)
                .uploadedAt(Instant.now())
                .width(width)
                .height(height)
                .build();
    }

    /**
     * Get content items with optional filtering
     */
    public List<ContentItem> getContentItems(String type, String folder) throws IOException {
        Path basePath = Paths.get(uploadDir);
        if (!Files.exists(basePath)) {
            return Collections.emptyList();
        }

        Path searchPath = folder != null && !folder.isEmpty()
                ? basePath.resolve(folder)
                : basePath;

        if (!Files.exists(searchPath)) {
            return Collections.emptyList();
        }

        try (Stream<Path> paths = Files.walk(searchPath)) {
            return paths
                    .filter(Files::isRegularFile)
                    .map(this::pathToContentItem)
                    .filter(Objects::nonNull)
                    .filter(item -> type == null || type.isEmpty() || type.equals(item.getType()))
                    .sorted(Comparator.comparing(ContentItem::getUploadedAt).reversed())
                    .collect(Collectors.toList());
        }
    }

    /**
     * Get a specific content item by ID
     */
    public Optional<ContentItem> getContentItem(String id) throws IOException {
        Path basePath = Paths.get(uploadDir);
        if (!Files.exists(basePath)) {
            return Optional.empty();
        }

        try (Stream<Path> paths = Files.walk(basePath)) {
            return paths
                    .filter(Files::isRegularFile)
                    .filter(p -> p.getFileName().toString().startsWith(id))
                    .map(this::pathToContentItem)
                    .filter(Objects::nonNull)
                    .findFirst();
        }
    }

    /**
     * Delete a content item
     */
    public boolean deleteContentItem(String id) throws IOException {
        Path basePath = Paths.get(uploadDir);
        if (!Files.exists(basePath)) {
            return false;
        }

        try (Stream<Path> paths = Files.walk(basePath)) {
            Optional<Path> filePath = paths
                    .filter(Files::isRegularFile)
                    .filter(p -> p.getFileName().toString().startsWith(id))
                    .findFirst();

            if (filePath.isPresent()) {
                Files.delete(filePath.get());
                log.info("Deleted content item: {}", id);
                return true;
            }
        }

        return false;
    }

    /**
     * Get repository statistics
     */
    public Map<String, Object> getStats() throws IOException {
        Map<String, Object> stats = new HashMap<>();

        Path basePath = Paths.get(uploadDir);
        if (!Files.exists(basePath)) {
            stats.put("totalFiles", 0);
            stats.put("totalSize", 0L);
            stats.put("images", 0);
            stats.put("videos", 0);
            stats.put("documents", 0);
            stats.put("other", 0);
            return stats;
        }

        try (Stream<Path> paths = Files.walk(basePath)) {
            List<ContentItem> items = paths
                    .filter(Files::isRegularFile)
                    .map(this::pathToContentItem)
                    .filter(Objects::nonNull)
                    .toList();

            stats.put("totalFiles", items.size());
            stats.put("totalSize", items.stream().mapToLong(ContentItem::getSize).sum());
            stats.put("images", items.stream().filter(i -> "image".equals(i.getType())).count());
            stats.put("videos", items.stream().filter(i -> "video".equals(i.getType())).count());
            stats.put("documents", items.stream().filter(i -> "pdf".equals(i.getType())).count());
            stats.put("other", items.stream().filter(i -> "other".equals(i.getType())).count());
        }

        return stats;
    }

    /**
     * Create a folder
     */
    public void createFolder(String folderPath) throws IOException {
        Path path = Paths.get(uploadDir, folderPath);
        Files.createDirectories(path);
        log.info("Created folder: {}", folderPath);
    }

    /**
     * Get all folders
     */
    public List<String> getFolders() throws IOException {
        Path basePath = Paths.get(uploadDir);
        if (!Files.exists(basePath)) {
            return Collections.emptyList();
        }

        try (Stream<Path> paths = Files.walk(basePath)) {
            return paths
                    .filter(Files::isDirectory)
                    .filter(p -> !p.equals(basePath))
                    .map(p -> basePath.relativize(p).toString())
                    .sorted()
                    .collect(Collectors.toList());
        }
    }

    // Helper methods

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum allowed size (50MB)");
        }

        String mimeType = file.getContentType();
        if (!isAllowedMimeType(mimeType)) {
            throw new IllegalArgumentException("File type not allowed: " + mimeType);
        }
    }

    private boolean isAllowedMimeType(String mimeType) {
        return ALLOWED_IMAGE_TYPES.contains(mimeType)
                || ALLOWED_VIDEO_TYPES.contains(mimeType)
                || ALLOWED_DOCUMENT_TYPES.contains(mimeType);
    }

    private String determineContentType(String mimeType) {
        if (ALLOWED_IMAGE_TYPES.contains(mimeType)) {
            return "image";
        } else if (ALLOWED_VIDEO_TYPES.contains(mimeType)) {
            return "video";
        } else if (mimeType != null && mimeType.equals("application/pdf")) {
            return "pdf";
        }
        return "other";
    }

    private Path getUploadPath(String folder) {
        if (folder != null && !folder.isEmpty()) {
            return Paths.get(uploadDir, folder);
        }
        return Paths.get(uploadDir);
    }

    private String getFileExtension(String filename) {
        if (filename == null) return "";
        int lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot) : "";
    }

    private String buildFileUrl(String folder, String filename) {
        if (folder != null && !folder.isEmpty()) {
            return baseUrl + "/" + folder + "/" + filename;
        }
        return baseUrl + "/" + filename;
    }

    private ContentItem pathToContentItem(Path path) {
        try {
            File file = path.toFile();
            String filename = file.getName();

            // Extract ID from filename (UUID before extension)
            int dotIndex = filename.lastIndexOf('.');
            String id = dotIndex > 0 ? filename.substring(0, dotIndex) : filename;

            // Get MIME type
            String mimeType = Files.probeContentType(path);
            if (mimeType == null) {
                mimeType = "application/octet-stream";
            }

            String type = determineContentType(mimeType);

            // Calculate relative path for folder
            Path basePath = Paths.get(uploadDir);
            Path relativePath = basePath.relativize(path.getParent());
            String folder = relativePath.toString();
            if (folder.equals(".") || folder.isEmpty()) {
                folder = "";
            }

            // Build URL
            String fileUrl = buildFileUrl(folder, filename);

            // Get image dimensions if applicable
            int width = 0;
            int height = 0;
            if ("image".equals(type) && !mimeType.equals("image/svg+xml")) {
                try {
                    BufferedImage image = ImageIO.read(file);
                    if (image != null) {
                        width = image.getWidth();
                        height = image.getHeight();
                    }
                } catch (Exception e) {
                    // Ignore dimension reading errors
                }
            }

            return ContentItem.builder()
                    .id(id)
                    .name(filename)
                    .originalName(filename)
                    .type(type)
                    .mimeType(mimeType)
                    .size(file.length())
                    .url(fileUrl)
                    .thumbnailUrl(fileUrl)
                    .folder(folder)
                    .uploadedAt(Instant.ofEpochMilli(file.lastModified()))
                    .width(width)
                    .height(height)
                    .build();
        } catch (Exception e) {
            log.warn("Error converting path to content item: {}", path, e);
            return null;
        }
    }
}
