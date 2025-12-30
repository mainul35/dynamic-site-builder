package dev.mainul35.cms.security.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "cms_oauth2_connections",
        uniqueConstraints = @UniqueConstraint(columnNames = {"provider", "provider_user_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OAuth2Connection {

    public static final String PROVIDER_GOOGLE = "google";
    public static final String PROVIDER_OKTA = "okta";
    public static final String PROVIDER_KEYCLOAK = "keycloak";
    public static final String PROVIDER_OIDC = "oidc";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private CmsUser user;

    @Column(nullable = false, length = 50)
    private String provider;

    @Column(name = "provider_user_id", nullable = false, length = 255)
    private String providerUserId;

    @Column(name = "provider_username", length = 255)
    private String providerUsername;

    @Column(name = "provider_email", length = 255)
    private String providerEmail;

    @Column(name = "access_token", length = 2000)
    private String accessToken;

    @Column(name = "refresh_token", length = 2000)
    private String refreshToken;

    @Column(name = "token_expires_at")
    private Instant tokenExpiresAt;

    @Column(name = "connected_at", nullable = false)
    private Instant connectedAt;

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    @PrePersist
    protected void onCreate() {
        if (connectedAt == null) {
            connectedAt = Instant.now();
        }
    }
}
