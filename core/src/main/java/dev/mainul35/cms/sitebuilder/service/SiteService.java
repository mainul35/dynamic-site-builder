package dev.mainul35.cms.sitebuilder.service;

import dev.mainul35.cms.sitebuilder.dto.CreateSiteRequest;
import dev.mainul35.cms.sitebuilder.dto.SiteDto;
import dev.mainul35.cms.sitebuilder.dto.UpdateSiteRequest;
import dev.mainul35.cms.sitebuilder.entity.Site;
import dev.mainul35.cms.sitebuilder.repository.SiteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for Site operations
 */
@Service
@Transactional
public class SiteService {

    private final SiteRepository siteRepository;

    public SiteService(SiteRepository siteRepository) {
        this.siteRepository = siteRepository;
    }

    /**
     * Get all sites for a user
     */
    public List<SiteDto> getSitesByOwner(Long ownerUserId) {
        return siteRepository.findByOwnerUserIdOrderByUpdatedAtDesc(ownerUserId)
                .stream()
                .map(SiteDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get a site by ID
     */
    public Optional<SiteDto> getSiteById(Long id) {
        return siteRepository.findById(id)
                .map(SiteDto::fromEntity);
    }

    /**
     * Get a site by slug
     */
    public Optional<SiteDto> getSiteBySlug(String slug) {
        return siteRepository.findBySiteSlug(slug)
                .map(SiteDto::fromEntity);
    }

    /**
     * Create a new site
     */
    public SiteDto createSite(CreateSiteRequest request, Long ownerUserId) {
        Site site = new Site();
        site.setSiteName(request.getSiteName());

        // Generate slug from site name if not provided
        String slug = request.getSiteSlug();
        if (slug == null || slug.isBlank()) {
            slug = generateSlug(request.getSiteName());
        }

        // Ensure unique slug
        slug = ensureUniqueSlug(slug, null);
        site.setSiteSlug(slug);

        // Set site mode
        if (request.getSiteMode() != null) {
            try {
                site.setSiteMode(Site.SiteMode.valueOf(request.getSiteMode().toUpperCase()));
            } catch (IllegalArgumentException e) {
                site.setSiteMode(Site.SiteMode.MULTI_PAGE);
            }
        }

        site.setDescription(request.getDescription());
        site.setOwnerUserId(ownerUserId);
        site.setPublished(false);

        Site savedSite = siteRepository.save(site);
        return SiteDto.fromEntity(savedSite);
    }

    /**
     * Update an existing site
     */
    public Optional<SiteDto> updateSite(Long id, UpdateSiteRequest request) {
        return siteRepository.findById(id)
                .map(site -> {
                    if (request.getSiteName() != null) {
                        site.setSiteName(request.getSiteName());
                    }
                    if (request.getDescription() != null) {
                        site.setDescription(request.getDescription());
                    }
                    if (request.getDomainName() != null) {
                        site.setDomainName(request.getDomainName());
                    }
                    if (request.getFaviconUrl() != null) {
                        site.setFaviconUrl(request.getFaviconUrl());
                    }
                    // metadata can be stored as JSON string

                    Site updatedSite = siteRepository.save(site);
                    return SiteDto.fromEntity(updatedSite);
                });
    }

    /**
     * Delete a site
     */
    public boolean deleteSite(Long id) {
        if (siteRepository.existsById(id)) {
            siteRepository.deleteById(id);
            return true;
        }
        return false;
    }

    /**
     * Publish a site
     */
    public Optional<SiteDto> publishSite(Long id) {
        return siteRepository.findById(id)
                .map(site -> {
                    site.setPublished(true);
                    site.setPublishedAt(LocalDateTime.now());
                    Site updatedSite = siteRepository.save(site);
                    return SiteDto.fromEntity(updatedSite);
                });
    }

    /**
     * Unpublish a site
     */
    public Optional<SiteDto> unpublishSite(Long id) {
        return siteRepository.findById(id)
                .map(site -> {
                    site.setPublished(false);
                    Site updatedSite = siteRepository.save(site);
                    return SiteDto.fromEntity(updatedSite);
                });
    }

    /**
     * Check if user owns the site
     */
    public boolean isOwner(Long siteId, Long userId) {
        return siteRepository.findById(siteId)
                .map(site -> site.getOwnerUserId().equals(userId))
                .orElse(false);
    }

    /**
     * Generate a URL-friendly slug from site name
     */
    private String generateSlug(String siteName) {
        return siteName.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    /**
     * Ensure the slug is unique, appending a number if necessary
     */
    private String ensureUniqueSlug(String slug, Long excludeId) {
        String baseSlug = slug;
        int counter = 1;

        while (true) {
            boolean exists;
            if (excludeId != null) {
                exists = siteRepository.existsBySiteSlugAndIdNot(slug, excludeId);
            } else {
                exists = siteRepository.existsBySiteSlug(slug);
            }

            if (!exists) {
                return slug;
            }

            slug = baseSlug + "-" + counter;
            counter++;
        }
    }
}
