package dev.mainul35.cms.security.repository;

import dev.mainul35.cms.security.entity.CmsRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CmsRoleRepository extends JpaRepository<CmsRole, Long> {

    Optional<CmsRole> findByRoleName(String roleName);

    boolean existsByRoleName(String roleName);
}
