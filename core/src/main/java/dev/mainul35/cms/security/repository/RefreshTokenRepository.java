package dev.mainul35.cms.security.repository;

import dev.mainul35.cms.security.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenId(String tokenId);

    List<RefreshToken> findByUserIdAndRevokedAtIsNull(Long userId);

    @Modifying
    @Transactional
    @Query("UPDATE RefreshToken rt SET rt.revokedAt = :revokedAt, rt.revokedReason = :reason " +
            "WHERE rt.tokenFamily = :family AND rt.revokedAt IS NULL")
    void revokeTokenFamily(@Param("family") String tokenFamily,
                           @Param("revokedAt") Instant revokedAt,
                           @Param("reason") String reason);

    @Modifying
    @Transactional
    @Query("UPDATE RefreshToken rt SET rt.revokedAt = :revokedAt, rt.revokedReason = :reason " +
            "WHERE rt.user.id = :userId AND rt.revokedAt IS NULL")
    void revokeAllUserTokens(@Param("userId") Long userId,
                             @Param("revokedAt") Instant revokedAt,
                             @Param("reason") String reason);

    @Modifying
    @Transactional
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now")
    void deleteExpiredTokens(@Param("now") Instant now);

    @Query("SELECT COUNT(rt) FROM RefreshToken rt WHERE rt.user.id = :userId AND rt.revokedAt IS NULL AND rt.expiresAt > :now")
    long countActiveTokensByUserId(@Param("userId") Long userId, @Param("now") Instant now);
}
