package dev.mainul35.flashcardapp.sitebuilder.dto;

/**
 * Result of fetching a single data source.
 */
public class DataSourceResult {

    private Object data;
    private boolean error;
    private int statusCode;
    private String errorMessage;

    public static DataSourceResult success(Object data) {
        DataSourceResult result = new DataSourceResult();
        result.data = data;
        result.error = false;
        result.statusCode = 200;
        return result;
    }

    public static DataSourceResult error(int statusCode, String message) {
        DataSourceResult result = new DataSourceResult();
        result.error = true;
        result.statusCode = statusCode;
        result.errorMessage = message;
        return result;
    }

    // Getters
    public Object getData() { return data; }
    public boolean isError() { return error; }
    public int getStatusCode() { return statusCode; }
    public String getErrorMessage() { return errorMessage; }

    // Setters
    public void setData(Object data) { this.data = data; }
    public void setError(boolean error) { this.error = error; }
    public void setStatusCode(int statusCode) { this.statusCode = statusCode; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}
