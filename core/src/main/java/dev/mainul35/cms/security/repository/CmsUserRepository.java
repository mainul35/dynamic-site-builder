package dev.mainul35.cms.security.repository;

import dev.mainul35.cms.security.entity.CmsUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CmsUserRepository extends JpaRepository<CmsUser, Long> {

    Optional<CmsUser> findByUsername(String username);

    Optional<CmsUser> findByEmail(String email);

    @Query("SELECT u FROM CmsUser u WHERE u.username = :usernameOrEmail OR u.email = :usernameOrEmail")
    Optional<CmsUser> findByUsernameOrEmail(@Param("usernameOrEmail") String usernameOrEmail,
                                             @Param("usernameOrEmail2") String usernameOrEmail2);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM CmsUser u WHERE u.status = 'PENDING' ORDER BY u.createdAt DESC")
    List<CmsUser> findPendingUsers();

    @Query("SELECT u FROM CmsUser u WHERE u.status = :status ORDER BY u.createdAt DESC")
    List<CmsUser> findByStatus(@Param("status") String status);

    @Query("SELECT u FROM CmsUser u WHERE u.isActive = true AND u.status = 'APPROVED'")
    List<CmsUser> findActiveApprovedUsers();
}
