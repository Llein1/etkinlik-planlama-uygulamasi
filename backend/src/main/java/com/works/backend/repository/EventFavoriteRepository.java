package com.works.backend.repository;

import com.works.backend.entity.EventFavorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EventFavoriteRepository extends JpaRepository<EventFavorite, Long> {
    boolean existsByEvent_IdAndUser_Id(Long eventId, Long userId);
    Page<EventFavorite> findByUser_Id(Long userId, Pageable pageable);

    @Query("select ef.event.id from EventFavorite ef where ef.user.id = :userId")
    List<Long> findEventIdsByUserId(Long userId);

    void deleteByEvent_IdAndUser_Id(Long eventId, Long userId);

    @Modifying
    @Query("DELETE FROM EventFavorite ef WHERE ef.event.id = :eventId")
    void deleteByEvent_Id(@Param("eventId") Long eventId);
}
