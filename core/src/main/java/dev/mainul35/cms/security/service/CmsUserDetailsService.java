package dev.mainul35.cms.security.service;

import dev.mainul35.cms.security.entity.CmsUser;
import dev.mainul35.cms.security.entity.RoleName;
import dev.mainul35.cms.security.repository.CmsUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CmsUserDetailsService implements UserDetailsService {

    private final CmsUserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        log.debug("Loading user by username or email: {}", usernameOrEmail);

        CmsUser user = userRepository.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail)
                .orElseThrow(() -> {
                    log.warn("User not found: {}", usernameOrEmail);
                    return new UsernameNotFoundException("User not found: " + usernameOrEmail);
                });

        if (!user.getIsActive()) {
            log.warn("User account is disabled: {}", usernameOrEmail);
            throw new UsernameNotFoundException("User account is disabled: " + usernameOrEmail);
        }

        if (!user.isApproved()) {
            log.warn("User account is not approved: {}", usernameOrEmail);
            throw new UsernameNotFoundException("User account is pending approval: " + usernameOrEmail);
        }

        var authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(RoleName.valueOf(role.getRoleName()).withRolePrefix()))
                .collect(Collectors.toList());

        return User.builder()
                .username(user.getUsername())
                .password(user.getPasswordHash())
                .authorities(authorities)
                .accountExpired(false)
                .accountLocked(!user.getIsActive())
                .credentialsExpired(false)
                .disabled(!user.getIsActive())
                .build();
    }
}
