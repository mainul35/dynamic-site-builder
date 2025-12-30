package dev.mainul35.cms.security.service;

import dev.mainul35.cms.security.entity.CmsRole;
import dev.mainul35.cms.security.entity.CmsUser;
import dev.mainul35.cms.security.repository.CmsRoleRepository;
import dev.mainul35.cms.security.repository.CmsUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Initializes required data at application startup.
 * Creates default roles and admin user if they don't exist.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final CmsUserRepository userRepository;
    private final CmsRoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        initializeRoles();
        initializeAdminUser();
    }

    private void initializeRoles() {
        // Create ADMIN role if it doesn't exist
        if (roleRepository.findByRoleName(CmsRole.ADMIN).isEmpty()) {
            CmsRole adminRole = CmsRole.builder()
                    .roleName(CmsRole.ADMIN)
                    .description("System administrator with full access")
                    .build();
            roleRepository.save(adminRole);
            log.info("Created ADMIN role");
        }

        // Create USER role if it doesn't exist
        if (roleRepository.findByRoleName(CmsRole.USER).isEmpty()) {
            CmsRole userRole = CmsRole.builder()
                    .roleName(CmsRole.USER)
                    .description("Regular user with limited access")
                    .build();
            roleRepository.save(userRole);
            log.info("Created USER role");
        }

        // Create DESIGNER role if it doesn't exist
        if (roleRepository.findByRoleName(CmsRole.DESIGNER).isEmpty()) {
            CmsRole designerRole = CmsRole.builder()
                    .roleName(CmsRole.DESIGNER)
                    .description("Site designer with edit access")
                    .build();
            roleRepository.save(designerRole);
            log.info("Created DESIGNER role");
        }

        // Create VIEWER role if it doesn't exist
        if (roleRepository.findByRoleName(CmsRole.VIEWER).isEmpty()) {
            CmsRole viewerRole = CmsRole.builder()
                    .roleName(CmsRole.VIEWER)
                    .description("Read-only access to content")
                    .build();
            roleRepository.save(viewerRole);
            log.info("Created VIEWER role");
        }
    }

    private void initializeAdminUser() {
        // Check if admin user already exists
        if (userRepository.existsByUsername("admin")) {
            log.debug("Admin user already exists");
            return;
        }

        // Get ADMIN role
        CmsRole adminRole = roleRepository.findByRoleName(CmsRole.ADMIN)
                .orElseThrow(() -> new RuntimeException("ADMIN role not found"));

        // Create default admin user
        CmsUser adminUser = CmsUser.builder()
                .username("admin")
                .email("admin@localhost")
                .passwordHash(passwordEncoder.encode("admin123"))
                .fullName("System Administrator")
                .isActive(true)
                .isAdmin(true)
                .status("APPROVED")
                .emailVerified(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        adminUser.getRoles().add(adminRole);
        userRepository.save(adminUser);

        log.info("=======================================================");
        log.info("Default admin user created:");
        log.info("  Username: admin");
        log.info("  Password: admin123");
        log.info("  IMPORTANT: Change this password after first login!");
        log.info("=======================================================");
    }
}
