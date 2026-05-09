package com.works.backend.repository;

import com.works.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailEqualsIgnoreCase(String email);
    boolean existsByEmailEqualsIgnoreCase(String email);
}

