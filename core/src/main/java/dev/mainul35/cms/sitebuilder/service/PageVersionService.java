package dev.mainul35.cms.sitebuilder.service;

import dev.mainul35.cms.sitebuilder.dto.PageVersionDto;
import dev.mainul35.cms.sitebuilder.entity.Page;
import dev.mainul35.cms.sitebuilder.entity.PageVersion;
import dev.mainul35.cms.sitebuilder.repository.PageRepository;
import dev.mainul35.cms.sitebuilder.repository.PageVersionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for managing page versions
 */
@Service
@Transactional
public class PageVersionService {

    private final PageVersionRepository pageVersionRepository;
    private final PageRepository pageRepository;

    public PageVersionService(PageVersionRepository pageVersionRepository, PageRepository pageRepository) {
        this.pageVersionRepository = pageVersionRepository;
        this.pageRepository = pageRepository;
    }

    /**
     * Get the active version for a page
     */
    public Optional<PageVersionDto> getActiveVersion(Long pageId) {
        return pageVersionRepository.findByPageIdAndIsActiveTrue(pageId)
                .map(PageVersionDto::fromEntity);
    }

    /**
     * Get the page definition (JSON) from the active version
     * Falls back to the latest version if no active version is found
     */
    public Optional<String> getPageDefinition(Long pageId) {
        // Try to get active version first
        Optional<PageVersion> activeVersion = pageVersionRepository.findByPageIdAndIsActiveTrue(pageId);
        if (activeVersion.isPresent()) {
            return Optional.of(activeVersion.get().getPageDefinition());
        }

        // Fall back to latest version
        return pageVersionRepository.findTopByPageIdOrderByVersionNumberDesc(pageId)
                .map(PageVersion::getPageDefinition);
    }

    /**
     * Save a new page version
     */
    public PageVersionDto savePageVersion(Long siteId, Long pageId, String pageDefinition,
                                          String changeDescription, Long userId) {
        Page page = pageRepository.findByIdAndSiteId(pageId, siteId)
                .orElseThrow(() -> new IllegalArgumentException("Page not found"));

        // Get the next version number
        Integer maxVersion = pageVersionRepository.findMaxVersionNumberByPageId(pageId);
        int nextVersion = maxVersion + 1;

        // Deactivate all existing versions
        pageVersionRepository.deactivateAllVersionsForPage(pageId);

        // Create new version
        PageVersion newVersion = new PageVersion();
        newVersion.setPage(page);
        newVersion.setVersionNumber(nextVersion);
        newVersion.setPageDefinition(pageDefinition);
        newVersion.setChangeDescription(changeDescription);
        newVersion.setCreatedByUserId(userId);
        newVersion.setActive(true);

        PageVersion savedVersion = pageVersionRepository.save(newVersion);
        return PageVersionDto.fromEntity(savedVersion);
    }

    /**
     * Get version history for a page
     */
    public List<PageVersionDto> getVersionHistory(Long pageId) {
        return pageVersionRepository.findByPageIdOrderByVersionNumberDesc(pageId)
                .stream()
                .map(PageVersionDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get a specific version by ID
     */
    public Optional<PageVersionDto> getVersion(Long pageId, Long versionId) {
        return pageVersionRepository.findByIdAndPageId(versionId, pageId)
                .map(PageVersionDto::fromEntity);
    }

    /**
     * Get a specific version by version number
     */
    public Optional<PageVersionDto> getVersionByNumber(Long pageId, Integer versionNumber) {
        return pageVersionRepository.findByPageIdAndVersionNumber(pageId, versionNumber)
                .map(PageVersionDto::fromEntity);
    }

    /**
     * Restore a page to a specific version
     * Creates a new version with the content from the restored version
     */
    public Optional<PageVersionDto> restoreVersion(Long siteId, Long pageId, Long versionId, Long userId) {
        return pageVersionRepository.findByIdAndPageId(versionId, pageId)
                .map(versionToRestore -> {
                    // Create a new version with the restored content
                    String description = "Restored from version " + versionToRestore.getVersionNumber();
                    return savePageVersion(siteId, pageId, versionToRestore.getPageDefinition(), description, userId);
                });
    }

    /**
     * Delete a specific version (cannot delete active version)
     */
    public boolean deleteVersion(Long pageId, Long versionId) {
        return pageVersionRepository.findByIdAndPageId(versionId, pageId)
                .map(version -> {
                    if (version.isActive()) {
                        throw new IllegalStateException("Cannot delete the active version");
                    }
                    pageVersionRepository.delete(version);
                    return true;
                })
                .orElse(false);
    }

    /**
     * Get the count of versions for a page
     */
    public long getVersionCount(Long pageId) {
        return pageVersionRepository.countByPageId(pageId);
    }
}
