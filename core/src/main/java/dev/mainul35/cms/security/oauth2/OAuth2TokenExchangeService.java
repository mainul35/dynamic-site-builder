package dev.mainul35.cms.security.oauth2;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Service for secure OAuth2 token exchange.
 * Generates short-lived authorization codes that can be exchanged for JWT tokens.
 * This prevents tokens from being exposed in URL query parameters.
 */
@Slf4j
@Service
public class OAuth2TokenExchangeService {

    private static final int CODE_LENGTH = 32;
    private static final long CODE_EXPIRY_SECONDS = 60; // Code expires in 60 seconds

    private final ConcurrentHashMap<String, TokenEntry> codeToTokenMap = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();
    private final ScheduledExecutorService cleanupScheduler;

    public OAuth2TokenExchangeService() {
        // Schedule cleanup of expired codes every minute
        this.cleanupScheduler = Executors.newSingleThreadScheduledExecutor();
        this.cleanupScheduler.scheduleAtFixedRate(this::cleanupExpiredCodes, 1, 1, TimeUnit.MINUTES);
    }

    /**
     * Generates a short-lived authorization code and stores the token for later exchange.
     *
     * @param accessToken The JWT access token to store
     * @return A short-lived authorization code
     */
    public String generateCode(String accessToken) {
        byte[] randomBytes = new byte[CODE_LENGTH];
        secureRandom.nextBytes(randomBytes);
        String code = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        TokenEntry entry = new TokenEntry(accessToken, System.currentTimeMillis() + (CODE_EXPIRY_SECONDS * 1000));
        codeToTokenMap.put(code, entry);

        log.debug("Generated OAuth2 exchange code (expires in {} seconds)", CODE_EXPIRY_SECONDS);
        return code;
    }

    /**
     * Exchanges an authorization code for the stored JWT token.
     * The code is single-use and will be invalidated after exchange.
     *
     * @param code The authorization code to exchange
     * @return The JWT access token, or null if code is invalid/expired
     */
    public String exchangeCode(String code) {
        if (code == null || code.isEmpty()) {
            log.warn("Attempted to exchange null or empty code");
            return null;
        }

        TokenEntry entry = codeToTokenMap.remove(code); // Remove immediately (single-use)

        if (entry == null) {
            log.warn("Attempted to exchange invalid or already-used code");
            return null;
        }

        if (System.currentTimeMillis() > entry.expiresAt) {
            log.warn("Attempted to exchange expired code");
            return null;
        }

        log.debug("Successfully exchanged OAuth2 code for token");
        return entry.token;
    }

    private void cleanupExpiredCodes() {
        long now = System.currentTimeMillis();
        int removed = 0;
        for (var iterator = codeToTokenMap.entrySet().iterator(); iterator.hasNext(); ) {
            var entry = iterator.next();
            if (now > entry.getValue().expiresAt) {
                iterator.remove();
                removed++;
            }
        }
        if (removed > 0) {
            log.debug("Cleaned up {} expired OAuth2 exchange codes", removed);
        }
    }

    private record TokenEntry(String token, long expiresAt) {}
}
