package dev.mainul35.cms.security.repository;

import dev.mainul35.cms.security.entity.CmsRole;
import dev.mainul35.cms.security.entity.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CmsRoleRepository extends JpaRepository<CmsRole, Long> {

    Optional<CmsRole> findByRoleName(String roleName);

    /**
     * Find a role by its enum name.
     */
    default Optional<CmsRole> findByRoleName(RoleName roleName) {
        return findByRoleName(roleName.name());
    }

    boolean existsByRoleName(String roleName);

    /**
     * Check if a role exists by its enum name.
     */
    default boolean existsByRoleName(RoleName roleName) {
        return existsByRoleName(roleName.name());
    }
}
