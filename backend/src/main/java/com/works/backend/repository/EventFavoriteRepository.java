package com.works.backend.repository;

import com.works.backend.entity.EventFavorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface EventFavoriteRepository extends JpaRepository<EventFavorite, Long> {
    boolean existsByEvent_IdAndUser_Id(Long eventId, Long userId);
    List<EventFavorite> findByUser_Id(Long userId);

    @Query("select ef.event.id from EventFavorite ef where ef.user.id = :userId")
    List<Long> findEventIdsByUserId(Long userId);

    void deleteByEvent_IdAndUser_Id(Long eventId, Long userId);
}
