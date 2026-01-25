package dev.mainul35.cms.security.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.servlet.view.RedirectView;

/**
 * Controller to handle /oauth2/callback requests that accidentally hit the backend.
 * This redirects them to the frontend with any query parameters preserved.
 */
@Slf4j
@Controller
public class OAuth2CallbackController {

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @GetMapping("/oauth2/callback")
    public RedirectView handleOAuth2Callback(HttpServletRequest request) {
        String queryString = request.getQueryString();
        log.info("=== OAuth2CallbackController triggered ===");
        log.info("Request URI: {}", request.getRequestURI());
        log.info("Query string present: {}", queryString != null && !queryString.isEmpty());
        log.info("Query string length: {}", queryString != null ? queryString.length() : 0);
        log.info("Has token param: {}", queryString != null && queryString.contains("token="));

        String redirectUrl = frontendUrl + "/oauth2/callback";
        if (queryString != null && !queryString.isEmpty()) {
            redirectUrl += "?" + queryString;
        }
        log.info("Redirecting to frontend: {}", redirectUrl);
        log.info("Redirect URL length: {}", redirectUrl.length());
        return new RedirectView(redirectUrl);
    }
}
