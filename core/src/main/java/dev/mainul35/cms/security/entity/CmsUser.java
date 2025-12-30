package dev.mainul35.cms.security.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "cms_users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CmsUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_admin", nullable = false)
    @Builder.Default
    private Boolean isAdmin = false;

    @Column(length = 20)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "avatar_url", length = 1000)
    private String avatarUrl;

    @Column(length = 10)
    @Builder.Default
    private String locale = "en";

    @Column(length = 50)
    private String timezone;

    @Column(name = "email_verified")
    @Builder.Default
    private Boolean emailVerified = false;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "cms_user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    private Set<CmsRole> roles = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<OAuth2Connection> oauth2Connections = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public boolean hasRole(String roleName) {
        return roles.stream()
                .anyMatch(role -> role.getRoleName().equals(roleName));
    }

    public boolean isApproved() {
        return "APPROVED".equals(status);
    }

    public boolean isPending() {
        return "PENDING".equals(status);
    }

    public boolean isRejected() {
        return "REJECTED".equals(status);
    }
}
