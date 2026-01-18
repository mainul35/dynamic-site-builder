package dev.mainul35.cms.security.entity;

/**
 * Enum representing the available role names in the CMS.
 * These correspond to the role_name values stored in the cms_roles table.
 */
public enum RoleName {
    ADMIN,
    DESIGNER,
    EDITOR,
    VIEWER,
    USER,
    ANONYMOUS;

    /**
     * Returns the role name prefixed with "ROLE_" for Spring Security.
     */
    public String withRolePrefix() {
        return "ROLE_" + this.name();
    }

    /**
     * Returns the role name prefixed with "ROLE_CMS_" for auth server mapping.
     */
    public String withCmsRolePrefix() {
        return "ROLE_CMS_" + this.name();
    }
}
