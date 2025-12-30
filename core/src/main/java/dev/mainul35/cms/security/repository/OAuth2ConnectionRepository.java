package dev.mainul35.cms.security.repository;

import dev.mainul35.cms.security.entity.OAuth2Connection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OAuth2ConnectionRepository extends JpaRepository<OAuth2Connection, Long> {

    Optional<OAuth2Connection> findByProviderAndProviderUserId(String provider, String providerUserId);

    List<OAuth2Connection> findByUserId(Long userId);

    Optional<OAuth2Connection> findByUserIdAndProvider(Long userId, String provider);

    boolean existsByProviderAndProviderUserId(String provider, String providerUserId);

    void deleteByUserIdAndProvider(Long userId, String provider);
}
