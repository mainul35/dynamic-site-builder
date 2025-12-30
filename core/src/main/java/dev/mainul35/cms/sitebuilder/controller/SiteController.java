package dev.mainul35.cms.sitebuilder.controller;

import dev.mainul35.cms.security.filter.JwtAuthenticationFilter.JwtUserPrincipal;
import dev.mainul35.cms.sitebuilder.dto.CreateSiteRequest;
import dev.mainul35.cms.sitebuilder.dto.SiteDto;
import dev.mainul35.cms.sitebuilder.dto.UpdateSiteRequest;
import dev.mainul35.cms.sitebuilder.service.SiteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Site management
 */
@RestController
@RequestMapping("/api/sites")
@CrossOrigin
public class SiteController {

    private final SiteService siteService;

    public SiteController(SiteService siteService) {
        this.siteService = siteService;
    }

    /**
     * Get all sites for the current user
     */
    @GetMapping
    public ResponseEntity<List<SiteDto>> getAllSites(
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<SiteDto> sites = siteService.getSitesByOwner(principal.userId());
        return ResponseEntity.ok(sites);
    }

    /**
     * Get a site by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getSiteById(
            @PathVariable Long id,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return siteService.getSiteById(id)
                .map(site -> {
                    // Check ownership
                    if (!site.getOwnerUserId().equals(principal.userId())) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(Map.of("error", "You don't have access to this site"));
                    }
                    return ResponseEntity.ok(site);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get a site by slug
     */
    @GetMapping("/slug/{slug}")
    public ResponseEntity<?> getSiteBySlug(
            @PathVariable String slug,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return siteService.getSiteBySlug(slug)
                .map(site -> {
                    // Check ownership
                    if (!site.getOwnerUserId().equals(principal.userId())) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(Map.of("error", "You don't have access to this site"));
                    }
                    return ResponseEntity.ok(site);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create a new site
     */
    @PostMapping
    public ResponseEntity<?> createSite(
            @Valid @RequestBody CreateSiteRequest request,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }

        try {
            SiteDto site = siteService.createSite(request, principal.userId());
            return ResponseEntity.status(HttpStatus.CREATED).body(site);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Failed to create site: " + e.getMessage()));
        }
    }

    /**
     * Update a site
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateSite(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSiteRequest request,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // Check ownership
        if (!siteService.isOwner(id, principal.userId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You don't have access to this site"));
        }

        return siteService.updateSite(id, request)
                .map(site -> ResponseEntity.ok(site))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Delete a site
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSite(
            @PathVariable Long id,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // Check ownership
        if (!siteService.isOwner(id, principal.userId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You don't have access to this site"));
        }

        if (siteService.deleteSite(id)) {
            return ResponseEntity.ok(Map.of("message", "Site deleted successfully"));
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Publish a site
     */
    @PostMapping("/{id}/publish")
    public ResponseEntity<?> publishSite(
            @PathVariable Long id,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // Check ownership
        if (!siteService.isOwner(id, principal.userId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You don't have access to this site"));
        }

        return siteService.publishSite(id)
                .map(site -> ResponseEntity.ok(site))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Unpublish a site
     */
    @PostMapping("/{id}/unpublish")
    public ResponseEntity<?> unpublishSite(
            @PathVariable Long id,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // Check ownership
        if (!siteService.isOwner(id, principal.userId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You don't have access to this site"));
        }

        return siteService.unpublishSite(id)
                .map(site -> ResponseEntity.ok(site))
                .orElse(ResponseEntity.notFound().build());
    }
}
