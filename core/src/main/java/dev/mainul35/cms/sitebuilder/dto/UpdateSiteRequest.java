package dev.mainul35.cms.sitebuilder.dto;

import jakarta.validation.constraints.Size;
import java.util.Map;

/**
 * DTO for updating a site
 */
public class UpdateSiteRequest {

    @Size(min = 3, max = 100, message = "Site name must be between 3 and 100 characters")
    private String siteName;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    private String domainName;

    private String faviconUrl;

    private Map<String, Object> metadata;

    public UpdateSiteRequest() {}

    public String getSiteName() {
        return siteName;
    }

    public void setSiteName(String siteName) {
        this.siteName = siteName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDomainName() {
        return domainName;
    }

    public void setDomainName(String domainName) {
        this.domainName = domainName;
    }

    public String getFaviconUrl() {
        return faviconUrl;
    }

    public void setFaviconUrl(String faviconUrl) {
        this.faviconUrl = faviconUrl;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
}
