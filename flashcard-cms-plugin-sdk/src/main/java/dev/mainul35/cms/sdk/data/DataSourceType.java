package dev.mainul35.cms.sdk.data;

/**
 * Types of data sources supported by the system.
 * Used in both Site Designer (Core) and Exported Sites (Site Runtime).
 */
public enum DataSourceType {
    /**
     * External/internal REST API data source.
     * Fetches data from HTTP endpoints.
     */
    API,

    /**
     * Static data defined in configuration.
     * Data is embedded in the component/page definition.
     */
    STATIC,

    /**
     * Data from request context (user info, session, etc.).
     * Resolved at runtime from the request context.
     */
    CONTEXT,

    /**
     * Database query data source.
     * Fetches data directly from database (JPA/MongoDB).
     */
    DATABASE
}
