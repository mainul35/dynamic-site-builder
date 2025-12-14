package dev.mainul35.flashcardapp.service;

import dev.mainul35.flashcardapp.entity.Media;
import dev.mainul35.flashcardapp.repository.LessonRepository;
import dev.mainul35.flashcardapp.repository.MediaRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MediaService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private final MediaRepository mediaRepository;
    private final LessonRepository lessonRepository;
    private final EntityManager entityManager;

    @Transactional
    public Media uploadFile(Long lessonId, MultipartFile file) {
        log.info("Uploading file for lesson: {}", lessonId);

        validateFile(file);

        return lessonRepository.findById(lessonId)
            .map(lesson -> {
                try {
                    String mediaType = determineMediaType(file.getContentType());
                    String uploadPath = uploadDir + "/" + mediaType + "s/";

                    String originalFilename = file.getOriginalFilename();
                    String extension = getFileExtension(originalFilename);
                    String uniqueFilename = UUID.randomUUID().toString() + "." + extension;

                    Path filePath = Paths.get(uploadPath, uniqueFilename);
                    Files.createDirectories(filePath.getParent());
                    Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                    Media media;
                    if (lesson.getMedia() != null) {
                        // Update existing media (replace the file)
                        log.info("Lesson already has media, updating existing media record");
                        media = lesson.getMedia();
                        // Delete old file from filesystem
                        deleteMediaFile(media);
                    } else {
                        // Create new media
                        log.info("Creating new media record for lesson");
                        media = new Media();
                        media.setLesson(lesson);
                    }

                    // Update/set all media properties
                    media.setFileName(uniqueFilename);
                    media.setOriginalFileName(originalFilename);
                    media.setMediaType(mediaType);
                    media.setFileExtension(extension);
                    media.setMimeType(file.getContentType());
                    media.setFilePath(filePath.toString());
                    media.setFileSize(file.getSize());

                    Media savedMedia = mediaRepository.save(media);
                    log.info("File uploaded successfully: {}", uniqueFilename);
                    return savedMedia;

                } catch (IOException e) {
                    log.error("Failed to upload file", e);
                    throw new RuntimeException("Failed to upload file: " + e.getMessage());
                }
            })
            .orElseThrow(() -> {
                log.error("Lesson not found with id: {}", lessonId);
                return new RuntimeException("Lesson not found with id: " + lessonId);
            });
    }

    @Transactional(readOnly = true)
    public Resource loadFileAsResource(String fileName) {
        log.info("Loading file: {}", fileName);

        return mediaRepository.findByFileName(fileName)
            .map(media -> {
                try {
                    Path filePath = Paths.get(media.getFilePath()).normalize();
                    Resource resource = new UrlResource(filePath.toUri());

                    if (resource.exists() && resource.isReadable()) {
                        return resource;
                    } else {
                        log.error("File not found or not readable: {}", fileName);
                        throw new RuntimeException("File not found or not readable: " + fileName);
                    }
                } catch (MalformedURLException e) {
                    log.error("Malformed file path", e);
                    throw new RuntimeException("Malformed file path: " + e.getMessage());
                }
            })
            .orElseThrow(() -> {
                log.error("File not found in database: {}", fileName);
                return new RuntimeException("File not found: " + fileName);
            });
    }

    @Transactional(readOnly = true)
    public Optional<Media> getMediaById(Long id) {
        return mediaRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Media> getMediaByLessonId(Long lessonId) {
        log.info("Fetching media for lesson: {}", lessonId);
        return mediaRepository.findByLessonId(lessonId);
    }

    @Transactional
    public void deleteMedia(Long id) {
        log.info("Deleting media with id: {}", id);

        mediaRepository.findById(id)
            .ifPresent(media -> {
                deleteMediaFile(media);
                mediaRepository.delete(media);
                log.info("Media record deleted: {}", id);
            });
    }

    /**
     * Helper method to delete media file from filesystem
     */
    private void deleteMediaFile(Media media) {
        try {
            Path filePath = Paths.get(media.getFilePath());
            Files.deleteIfExists(filePath);
            log.info("File deleted from filesystem: {}", media.getFileName());
        } catch (IOException e) {
            log.warn("Failed to delete file from filesystem: {}", media.getFileName(), e);
        }
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        long maxSize = 1000 * 1024 * 1024; // 1GB
        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException("File size exceeds maximum limit of 1GB");
        }

        String contentType = file.getContentType();
        if (contentType == null) {
            throw new IllegalArgumentException("File content type is unknown");
        }

        try {
            determineMediaType(contentType);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unsupported file type: " + contentType);
        }
    }

    private String determineMediaType(String mimeType) {
        if (mimeType.startsWith("image/")) {
            return "image";
        }
        if (mimeType.startsWith("video/")) {
            return "video";
        }
        if (mimeType.equals("application/pdf")) {
            return "pdf";
        }
        if (mimeType.startsWith("audio/")) {
            return "audio";
        }
        throw new IllegalArgumentException("Unsupported media type: " + mimeType);
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }
        int lastDotIndex = filename.lastIndexOf('.');
        return (lastDotIndex == -1) ? "" : filename.substring(lastDotIndex + 1);
    }

    public String getMimeTypeByFileName(String fileName) {
        return mediaRepository.findByFileName(fileName)
            .map(Media::getMimeType)
            .orElse("application/octet-stream");
    }
}
