package dev.mainul35.cms.security.oauth2;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for OAuth2 token exchange.
 * Allows the frontend to exchange a short-lived authorization code for a JWT token.
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class OAuth2TokenExchangeController {

    private final OAuth2TokenExchangeService tokenExchangeService;

    /**
     * Exchange an authorization code for a JWT token.
     * This endpoint is public as it's called during the OAuth2 callback flow.
     *
     * @param request The exchange request containing the authorization code
     * @return The JWT token if the code is valid
     */
    @PostMapping("/oauth2/exchange")
    public ResponseEntity<?> exchangeToken(@RequestBody TokenExchangeRequest request) {
        if (request.code() == null || request.code().isEmpty()) {
            log.warn("Token exchange request with missing code");
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "invalid_request", "message", "Authorization code is required"));
        }

        String token = tokenExchangeService.exchangeCode(request.code());

        if (token == null) {
            log.warn("Token exchange failed - invalid, expired, or already used code");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "invalid_grant", "message", "Invalid, expired, or already used authorization code"));
        }

        log.info("Successfully exchanged OAuth2 code for token");
        return ResponseEntity.ok(new TokenExchangeResponse(token, "Bearer"));
    }

    public record TokenExchangeRequest(String code) {}

    public record TokenExchangeResponse(String accessToken, String tokenType) {}
}
