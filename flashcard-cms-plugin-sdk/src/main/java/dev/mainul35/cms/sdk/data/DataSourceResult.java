package dev.mainul35.cms.sdk.data;

/**
 * Result of fetching a single data source.
 * Contains either the fetched data or error information.
 */
public class DataSourceResult {

    /**
     * The fetched data (could be Map, List, or primitive)
     */
    private Object data;

    /**
     * Whether an error occurred during fetch
     */
    private boolean error;

    /**
     * HTTP status code (for API data sources)
     */
    private int statusCode;

    /**
     * Error message if error is true
     */
    private String errorMessage;

    /**
     * Time taken to fetch this data source (in milliseconds)
     */
    private long fetchTimeMs;

    /**
     * Whether the result was served from cache
     */
    private boolean cached;

    public DataSourceResult() {}

    /**
     * Create a successful result
     */
    public static DataSourceResult success(Object data) {
        DataSourceResult result = new DataSourceResult();
        result.data = data;
        result.error = false;
        result.statusCode = 200;
        return result;
    }

    /**
     * Create a successful result with cache indicator
     */
    public static DataSourceResult success(Object data, boolean cached) {
        DataSourceResult result = success(data);
        result.cached = cached;
        return result;
    }

    /**
     * Create a successful result with timing information
     */
    public static DataSourceResult success(Object data, long fetchTimeMs) {
        DataSourceResult result = success(data);
        result.fetchTimeMs = fetchTimeMs;
        return result;
    }

    /**
     * Create an error result
     */
    public static DataSourceResult error(int statusCode, String message) {
        DataSourceResult result = new DataSourceResult();
        result.error = true;
        result.statusCode = statusCode;
        result.errorMessage = message;
        return result;
    }

    /**
     * Create an error result from an exception
     */
    public static DataSourceResult error(Exception e) {
        DataSourceResult result = new DataSourceResult();
        result.error = true;
        result.statusCode = 500;
        result.errorMessage = e.getMessage();
        return result;
    }

    /**
     * Create a not found error result
     */
    public static DataSourceResult notFound(String message) {
        return error(404, message);
    }

    /**
     * Create a bad request error result
     */
    public static DataSourceResult badRequest(String message) {
        return error(400, message);
    }

    /**
     * Create an unauthorized error result
     */
    public static DataSourceResult unauthorized(String message) {
        return error(401, message);
    }

    /**
     * Create a forbidden error result
     */
    public static DataSourceResult forbidden(String message) {
        return error(403, message);
    }

    // Getters and setters
    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }

    public boolean isError() {
        return error;
    }

    public void setError(boolean error) {
        this.error = error;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(int statusCode) {
        this.statusCode = statusCode;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public long getFetchTimeMs() {
        return fetchTimeMs;
    }

    public void setFetchTimeMs(long fetchTimeMs) {
        this.fetchTimeMs = fetchTimeMs;
    }

    public boolean isCached() {
        return cached;
    }

    public void setCached(boolean cached) {
        this.cached = cached;
    }

    @Override
    public String toString() {
        if (error) {
            return "DataSourceResult{error=true, statusCode=" + statusCode +
                    ", errorMessage='" + errorMessage + "'}";
        }
        return "DataSourceResult{error=false, statusCode=" + statusCode +
                ", cached=" + cached + ", fetchTimeMs=" + fetchTimeMs + '}';
    }
}
