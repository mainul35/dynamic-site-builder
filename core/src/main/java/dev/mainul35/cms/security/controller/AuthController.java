package dev.mainul35.cms.security.controller;

import dev.mainul35.cms.security.dto.AuthResponse;
import dev.mainul35.cms.security.dto.LoginRequest;
import dev.mainul35.cms.security.dto.RegisterRequest;
import dev.mainul35.cms.security.dto.TokenRefreshRequest;
import dev.mainul35.cms.security.exception.AuthenticationException;
import dev.mainul35.cms.security.exception.UserAlreadyExistsException;
import dev.mainul35.cms.security.filter.JwtAuthenticationFilter.JwtUserPrincipal;
import dev.mainul35.cms.security.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        try {
            AuthResponse response = authService.login(request, httpRequest);
            log.info("User logged in: {}", request.getUsernameOrEmail());
            return ResponseEntity.ok(response);
        } catch (AuthenticationException e) {
            log.warn("Login failed for {}: {}", request.getUsernameOrEmail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            log.info("New user registered: {}", request.getUsername());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "message", "Registration successful. Your account is pending approval.",
                            "user", response.getUser()
                    ));
        } catch (UserAlreadyExistsException e) {
            log.warn("Registration failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(
            @Valid @RequestBody TokenRefreshRequest request,
            HttpServletRequest httpRequest
    ) {
        try {
            AuthResponse response = authService.refreshToken(request.getRefreshToken(), httpRequest);
            return ResponseEntity.ok(response);
        } catch (AuthenticationException e) {
            log.warn("Token refresh failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody(required = false) TokenRefreshRequest request) {
        if (request != null && request.getRefreshToken() != null) {
            authService.logout(request.getRefreshToken());
        }
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @PostMapping("/logout-all")
    public ResponseEntity<?> logoutAll(@AuthenticationPrincipal JwtUserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated"));
        }
        authService.logoutAllSessions(principal.userId());
        return ResponseEntity.ok(Map.of("message", "All sessions logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal JwtUserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated"));
        }
        return ResponseEntity.ok(Map.of(
                "userId", principal.userId(),
                "email", principal.email(),
                "roles", principal.roles()
        ));
    }

    @GetMapping("/check")
    public ResponseEntity<?> checkAuth(@AuthenticationPrincipal JwtUserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.ok(Map.of("authenticated", false));
        }
        return ResponseEntity.ok(Map.of(
                "authenticated", true,
                "userId", principal.userId(),
                "email", principal.email(),
                "roles", principal.roles()
        ));
    }
}
