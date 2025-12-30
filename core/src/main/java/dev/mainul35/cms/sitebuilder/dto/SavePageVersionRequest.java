package dev.mainul35.cms.sitebuilder.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for saving a new page version
 */
public class SavePageVersionRequest {

    /**
     * The page definition as JSON string
     */
    @NotBlank(message = "Page definition is required")
    private String pageDefinition;

    /**
     * Optional description of changes in this version
     */
    private String changeDescription;

    public SavePageVersionRequest() {
    }

    public SavePageVersionRequest(String pageDefinition, String changeDescription) {
        this.pageDefinition = pageDefinition;
        this.changeDescription = changeDescription;
    }

    public String getPageDefinition() {
        return pageDefinition;
    }

    public void setPageDefinition(String pageDefinition) {
        this.pageDefinition = pageDefinition;
    }

    public String getChangeDescription() {
        return changeDescription;
    }

    public void setChangeDescription(String changeDescription) {
        this.changeDescription = changeDescription;
    }
}
