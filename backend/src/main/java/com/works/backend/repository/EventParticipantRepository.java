package com.works.backend.repository;

import com.works.backend.entity.EventParticipant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventParticipantRepository extends JpaRepository<EventParticipant, Long> {
    List<EventParticipant> findByEvent_Id(Long eventId);
    Page<EventParticipant> findByUser_Id(Long userId, Pageable pageable);
    boolean existsByEvent_IdAndUser_Id(Long eventId, Long userId);
    long countByEvent_Id(Long eventId);
}

