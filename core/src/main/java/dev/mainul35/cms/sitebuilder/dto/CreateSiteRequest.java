package dev.mainul35.cms.sitebuilder.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for creating a new site
 */
public class CreateSiteRequest {

    @NotBlank(message = "Site name is required")
    @Size(min = 3, max = 100, message = "Site name must be between 3 and 100 characters")
    private String siteName;

    private String siteSlug;

    private String siteMode = "multi_page";

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    public CreateSiteRequest() {}

    public String getSiteName() {
        return siteName;
    }

    public void setSiteName(String siteName) {
        this.siteName = siteName;
    }

    public String getSiteSlug() {
        return siteSlug;
    }

    public void setSiteSlug(String siteSlug) {
        this.siteSlug = siteSlug;
    }

    public String getSiteMode() {
        return siteMode;
    }

    public void setSiteMode(String siteMode) {
        this.siteMode = siteMode;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
