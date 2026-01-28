package dev.mainul35.cms.security.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Controller to handle /oauth2/callback requests.
 * In production (frontend embedded in backend), serves index.html so the SPA handles the route.
 * In development (separate frontend server), redirects to the frontend URL.
 */
@Slf4j
@Controller
public class OAuth2CallbackController {

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @GetMapping(value = "/oauth2/callback", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String handleOAuth2Callback(HttpServletRequest request) throws IOException {
        String queryString = request.getQueryString();
        log.info("=== OAuth2CallbackController triggered ===");
        log.info("Request URI: {}", request.getRequestURI());
        log.info("Has token param: {}", queryString != null && queryString.contains("token="));

        // Determine if the frontend is served from the same origin as the backend.
        String requestUrl = request.getRequestURL().toString();
        String requestOrigin = extractOrigin(requestUrl);
        String frontendOrigin = extractOrigin(frontendUrl);

        if (requestOrigin.equals(frontendOrigin)) {
            // Production: frontend is embedded in backend - serve SPA index.html directly
            log.info("Same origin detected ({}), serving index.html", requestOrigin);
            ClassPathResource indexHtml = new ClassPathResource("/static/index.html");
            return indexHtml.getContentAsString(StandardCharsets.UTF_8);
        } else {
            // Development: frontend runs on separate server - redirect
            String redirectUrl = frontendUrl + "/oauth2/callback";
            if (queryString != null && !queryString.isEmpty()) {
                redirectUrl += "?" + queryString;
            }
            log.info("Different origin detected, redirecting to: {}", redirectUrl);
            // Return an HTML redirect since we're using @ResponseBody
            return "<html><head><meta http-equiv=\"refresh\" content=\"0;url=" + redirectUrl + "\"></head></html>";
        }
    }

    private String extractOrigin(String url) {
        try {
            java.net.URI uri = java.net.URI.create(url);
            String scheme = uri.getScheme();
            String host = uri.getHost();
            int port = uri.getPort();
            if (port == -1 || (port == 443 && "https".equals(scheme)) || (port == 80 && "http".equals(scheme))) {
                return scheme + "://" + host;
            }
            return scheme + "://" + host + ":" + port;
        } catch (Exception e) {
            return url;
        }
    }
}
