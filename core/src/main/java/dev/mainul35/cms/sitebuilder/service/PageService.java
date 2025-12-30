package dev.mainul35.cms.sitebuilder.service;

import dev.mainul35.cms.sitebuilder.dto.CreatePageRequest;
import dev.mainul35.cms.sitebuilder.dto.PageDto;
import dev.mainul35.cms.sitebuilder.dto.UpdatePageRequest;
import dev.mainul35.cms.sitebuilder.entity.Page;
import dev.mainul35.cms.sitebuilder.entity.Site;
import dev.mainul35.cms.sitebuilder.repository.PageRepository;
import dev.mainul35.cms.sitebuilder.repository.SiteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for Page operations
 */
@Service
@Transactional
public class PageService {

    private final PageRepository pageRepository;
    private final SiteRepository siteRepository;

    public PageService(PageRepository pageRepository, SiteRepository siteRepository) {
        this.pageRepository = pageRepository;
        this.siteRepository = siteRepository;
    }

    /**
     * Get all pages for a site
     */
    public List<PageDto> getPagesBySite(Long siteId) {
        return pageRepository.findBySiteIdOrderByDisplayOrderAsc(siteId)
                .stream()
                .map(PageDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get a page by ID
     */
    public Optional<PageDto> getPageById(Long siteId, Long pageId) {
        return pageRepository.findByIdAndSiteId(pageId, siteId)
                .map(PageDto::fromEntity);
    }

    /**
     * Get a page by slug
     */
    public Optional<PageDto> getPageBySlug(Long siteId, String slug) {
        return pageRepository.findBySiteIdAndPageSlug(siteId, slug)
                .map(PageDto::fromEntity);
    }

    /**
     * Create a new page
     */
    public PageDto createPage(Long siteId, CreatePageRequest request) {
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new IllegalArgumentException("Site not found"));

        Page page = new Page();
        page.setSite(site);
        page.setPageName(request.getPageName());

        // Generate slug if not provided
        String slug = request.getPageSlug();
        if (slug == null || slug.isBlank()) {
            slug = generateSlug(request.getPageName());
        }
        slug = ensureUniqueSlug(siteId, slug, null);
        page.setPageSlug(slug);

        // Set page type
        if (request.getPageType() != null) {
            try {
                page.setPageType(Page.PageType.valueOf(request.getPageType().toUpperCase()));
            } catch (IllegalArgumentException e) {
                page.setPageType(Page.PageType.STANDARD);
            }
        }

        page.setTitle(request.getTitle());
        page.setDescription(request.getDescription());

        // Set route path
        String routePath = request.getRoutePath();
        if (routePath == null || routePath.isBlank()) {
            routePath = "/" + slug;
        }
        page.setRoutePath(routePath);

        // Set parent page if provided
        if (request.getParentPageId() != null) {
            pageRepository.findByIdAndSiteId(request.getParentPageId(), siteId)
                    .ifPresent(page::setParentPage);
        }

        // Set display order
        Integer maxOrder;
        if (request.getParentPageId() != null) {
            maxOrder = pageRepository.findMaxDisplayOrderForChildren(request.getParentPageId());
        } else {
            maxOrder = pageRepository.findMaxDisplayOrderForRootPages(siteId);
        }
        page.setDisplayOrder(maxOrder + 1);

        page.setLayoutId(request.getLayoutId());
        page.setPublished(false);

        Page savedPage = pageRepository.save(page);
        return PageDto.fromEntity(savedPage);
    }

    /**
     * Update an existing page
     */
    public Optional<PageDto> updatePage(Long siteId, Long pageId, UpdatePageRequest request) {
        return pageRepository.findByIdAndSiteId(pageId, siteId)
                .map(page -> {
                    if (request.getPageName() != null) {
                        page.setPageName(request.getPageName());
                    }
                    if (request.getTitle() != null) {
                        page.setTitle(request.getTitle());
                    }
                    if (request.getDescription() != null) {
                        page.setDescription(request.getDescription());
                    }
                    if (request.getRoutePath() != null) {
                        page.setRoutePath(request.getRoutePath());
                    }
                    if (request.getLayoutId() != null) {
                        page.setLayoutId(request.getLayoutId());
                    }
                    if (request.getDisplayOrder() != null) {
                        page.setDisplayOrder(request.getDisplayOrder());
                    }

                    // Handle parent page change
                    if (request.getParentPageId() != null) {
                        if (request.getParentPageId().equals(0L)) {
                            // Set to root
                            page.setParentPage(null);
                        } else {
                            pageRepository.findByIdAndSiteId(request.getParentPageId(), siteId)
                                    .ifPresent(page::setParentPage);
                        }
                    }

                    Page updatedPage = pageRepository.save(page);
                    return PageDto.fromEntity(updatedPage);
                });
    }

    /**
     * Delete a page
     */
    public boolean deletePage(Long siteId, Long pageId) {
        return pageRepository.findByIdAndSiteId(pageId, siteId)
                .map(page -> {
                    // Move children to root or to grandparent
                    List<Page> children = pageRepository.findByParentPageIdOrderByDisplayOrderAsc(pageId);
                    for (Page child : children) {
                        child.setParentPage(page.getParentPage());
                        pageRepository.save(child);
                    }

                    pageRepository.delete(page);
                    return true;
                })
                .orElse(false);
    }

    /**
     * Publish a page
     */
    public Optional<PageDto> publishPage(Long siteId, Long pageId) {
        return pageRepository.findByIdAndSiteId(pageId, siteId)
                .map(page -> {
                    page.setPublished(true);
                    page.setPublishedAt(LocalDateTime.now());
                    Page updatedPage = pageRepository.save(page);
                    return PageDto.fromEntity(updatedPage);
                });
    }

    /**
     * Unpublish a page
     */
    public Optional<PageDto> unpublishPage(Long siteId, Long pageId) {
        return pageRepository.findByIdAndSiteId(pageId, siteId)
                .map(page -> {
                    page.setPublished(false);
                    Page updatedPage = pageRepository.save(page);
                    return PageDto.fromEntity(updatedPage);
                });
    }

    /**
     * Duplicate a page
     */
    public Optional<PageDto> duplicatePage(Long siteId, Long pageId, String newPageName) {
        return pageRepository.findByIdAndSiteId(pageId, siteId)
                .map(originalPage -> {
                    Page newPage = new Page();
                    newPage.setSite(originalPage.getSite());

                    String name = newPageName != null ? newPageName : originalPage.getPageName() + " (Copy)";
                    newPage.setPageName(name);

                    String slug = generateSlug(name);
                    slug = ensureUniqueSlug(siteId, slug, null);
                    newPage.setPageSlug(slug);

                    newPage.setPageType(originalPage.getPageType());
                    newPage.setTitle(originalPage.getTitle());
                    newPage.setDescription(originalPage.getDescription());
                    newPage.setRoutePath("/" + slug);
                    newPage.setParentPage(originalPage.getParentPage());
                    newPage.setLayoutId(originalPage.getLayoutId());
                    newPage.setPublished(false);

                    // Set display order after original
                    newPage.setDisplayOrder(originalPage.getDisplayOrder() + 1);

                    Page savedPage = pageRepository.save(newPage);
                    return PageDto.fromEntity(savedPage);
                });
    }

    /**
     * Reorder pages
     */
    public void reorderPages(Long siteId, List<PageReorderItem> reorderItems) {
        for (PageReorderItem item : reorderItems) {
            pageRepository.findByIdAndSiteId(item.getPageId(), siteId)
                    .ifPresent(page -> {
                        page.setDisplayOrder(item.getDisplayOrder());
                        pageRepository.save(page);
                    });
        }
    }

    /**
     * Get child pages of a parent
     */
    public List<PageDto> getChildPages(Long siteId, Long parentPageId) {
        return pageRepository.findByParentPageIdOrderByDisplayOrderAsc(parentPageId)
                .stream()
                .filter(page -> page.getSite().getId().equals(siteId))
                .map(PageDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Generate a URL-friendly slug from page name
     */
    private String generateSlug(String pageName) {
        return pageName.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    /**
     * Ensure the slug is unique within the site
     */
    private String ensureUniqueSlug(Long siteId, String slug, Long excludePageId) {
        String baseSlug = slug;
        int counter = 1;

        while (true) {
            boolean exists;
            if (excludePageId != null) {
                exists = pageRepository.existsBySiteIdAndPageSlugAndIdNot(siteId, slug, excludePageId);
            } else {
                exists = pageRepository.existsBySiteIdAndPageSlug(siteId, slug);
            }

            if (!exists) {
                return slug;
            }

            slug = baseSlug + "-" + counter;
            counter++;
        }
    }

    /**
     * Helper class for page reordering
     */
    public static class PageReorderItem {
        private Long pageId;
        private Integer displayOrder;

        public Long getPageId() {
            return pageId;
        }

        public void setPageId(Long pageId) {
            this.pageId = pageId;
        }

        public Integer getDisplayOrder() {
            return displayOrder;
        }

        public void setDisplayOrder(Integer displayOrder) {
            this.displayOrder = displayOrder;
        }
    }
}
