package dev.mainul35.cms.security.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "cms_roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CmsRole {

    public static final String ADMIN = "ADMIN";
    public static final String DESIGNER = "DESIGNER";
    public static final String VIEWER = "VIEWER";
    public static final String USER = "USER";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "role_name", nullable = false, unique = true, length = 50)
    private String roleName;

    @Column(length = 255)
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
