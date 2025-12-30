package dev.mainul35.cms.security.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private long expiresIn;
    private UserProfile user;

    public static AuthResponse of(String accessToken, String refreshToken, long expiresIn, UserProfile user) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(expiresIn)
                .user(user)
                .build();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserProfile {
        private Long id;
        private String username;
        private String email;
        private String fullName;
        private String avatarUrl;
        private Set<String> roles;
        private Boolean emailVerified;
    }
}
