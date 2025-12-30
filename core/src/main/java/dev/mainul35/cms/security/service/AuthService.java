package dev.mainul35.cms.security.service;

import dev.mainul35.cms.security.dto.AuthResponse;
import dev.mainul35.cms.security.dto.LoginRequest;
import dev.mainul35.cms.security.dto.RegisterRequest;
import dev.mainul35.cms.security.entity.CmsRole;
import dev.mainul35.cms.security.entity.CmsUser;
import dev.mainul35.cms.security.entity.RefreshToken;
import dev.mainul35.cms.security.exception.AuthenticationException;
import dev.mainul35.cms.security.exception.UserAlreadyExistsException;
import dev.mainul35.cms.security.repository.CmsRoleRepository;
import dev.mainul35.cms.security.repository.CmsUserRepository;
import dev.mainul35.cms.security.repository.RefreshTokenRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final CmsUserRepository userRepository;
    private final CmsRoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsernameOrEmail(),
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException e) {
            log.warn("Failed login attempt for: {}", request.getUsernameOrEmail());
            throw new AuthenticationException("Invalid username/email or password");
        }

        CmsUser user = userRepository.findByUsernameOrEmail(
                        request.getUsernameOrEmail(),
                        request.getUsernameOrEmail())
                .orElseThrow(() -> new AuthenticationException("User not found"));

        if (!user.isApproved()) {
            throw new AuthenticationException("Your account is pending approval");
        }

        // Update last login
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        return generateAuthResponse(user, httpRequest);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check if username exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException("Username already taken");
        }

        // Check if email exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already registered");
        }

        // Get default USER role
        CmsRole userRole = roleRepository.findByRoleName(CmsRole.USER)
                .orElseThrow(() -> new RuntimeException("Default role not found"));

        // Create new user with PENDING status
        CmsUser user = CmsUser.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .isActive(true)
                .isAdmin(false)
                .status("PENDING")
                .emailVerified(false)
                .build();

        user.getRoles().add(userRole);
        userRepository.save(user);

        log.info("New user registered: {} (pending approval)", user.getUsername());

        // Return response without tokens since user needs approval
        return AuthResponse.builder()
                .user(mapToUserProfile(user))
                .build();
    }

    @Transactional
    public AuthResponse refreshToken(String refreshTokenValue, HttpServletRequest httpRequest) {
        if (!jwtService.isTokenValid(refreshTokenValue)) {
            throw new AuthenticationException("Invalid refresh token");
        }

        if (!jwtService.isRefreshToken(refreshTokenValue)) {
            throw new AuthenticationException("Token is not a refresh token");
        }

        String tokenId = jwtService.extractTokenId(refreshTokenValue);
        String tokenFamily = jwtService.extractTokenFamily(refreshTokenValue);

        RefreshToken storedToken = refreshTokenRepository.findByTokenId(tokenId)
                .orElseThrow(() -> new AuthenticationException("Refresh token not found"));

        // Check if token is revoked (potential token reuse attack)
        if (storedToken.isRevoked()) {
            log.warn("Attempted reuse of revoked refresh token. Revoking entire family: {}", tokenFamily);
            refreshTokenRepository.revokeTokenFamily(tokenFamily, Instant.now(), "Token reuse detected");
            throw new AuthenticationException("Token has been revoked");
        }

        if (storedToken.isExpired()) {
            throw new AuthenticationException("Refresh token has expired");
        }

        // Revoke the used token
        storedToken.revoke("Token rotated");
        refreshTokenRepository.save(storedToken);

        CmsUser user = storedToken.getUser();

        if (!user.getIsActive() || !user.isApproved()) {
            throw new AuthenticationException("User account is not active");
        }

        return generateAuthResponse(user, httpRequest, tokenFamily);
    }

    @Transactional
    public void logout(String refreshTokenValue) {
        if (refreshTokenValue == null || refreshTokenValue.isBlank()) {
            return;
        }

        try {
            String tokenId = jwtService.extractTokenId(refreshTokenValue);
            if (tokenId != null) {
                refreshTokenRepository.findByTokenId(tokenId)
                        .ifPresent(token -> {
                            token.revoke("User logout");
                            refreshTokenRepository.save(token);
                        });
            }
        } catch (Exception e) {
            log.warn("Error during logout: {}", e.getMessage());
        }
    }

    @Transactional
    public void logoutAllSessions(Long userId) {
        refreshTokenRepository.revokeAllUserTokens(userId, Instant.now(), "Logout all sessions");
        log.info("All sessions revoked for user: {}", userId);
    }

    private AuthResponse generateAuthResponse(CmsUser user, HttpServletRequest httpRequest) {
        return generateAuthResponse(user, httpRequest, UUID.randomUUID().toString());
    }

    private AuthResponse generateAuthResponse(CmsUser user, HttpServletRequest httpRequest, String tokenFamily) {
        // Generate access token
        String accessToken = jwtService.generateAccessToken(user);

        // Generate refresh token
        String tokenId = UUID.randomUUID().toString();
        String refreshToken = jwtService.generateRefreshToken(user.getId(), tokenId, tokenFamily);

        // Store refresh token
        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .tokenId(tokenId)
                .user(user)
                .tokenFamily(tokenFamily)
                .tokenHash(hashToken(refreshToken))
                .expiresAt(Instant.now().plusMillis(jwtService.getRefreshTokenExpiration()))
                .userAgent(httpRequest != null ? httpRequest.getHeader("User-Agent") : null)
                .ipAddress(httpRequest != null ? getClientIp(httpRequest) : null)
                .build();

        refreshTokenRepository.save(refreshTokenEntity);

        return AuthResponse.of(
                accessToken,
                refreshToken,
                jwtService.getAccessTokenExpiration() / 1000,
                mapToUserProfile(user)
        );
    }

    private AuthResponse.UserProfile mapToUserProfile(CmsUser user) {
        Set<String> roles = user.getRoles().stream()
                .map(CmsRole::getRoleName)
                .collect(Collectors.toSet());

        return AuthResponse.UserProfile.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .roles(roles)
                .emailVerified(user.getEmailVerified())
                .build();
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
