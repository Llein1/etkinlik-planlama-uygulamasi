package com.works.backend.repository;

import com.works.backend.entity.EventParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventParticipantRepository extends JpaRepository<EventParticipant, Long> {
    List<EventParticipant> findByEvent_Id(Long eventId);
    List<EventParticipant> findByUser_Id(Long userId);
    boolean existsByEvent_IdAndUser_Id(Long eventId, Long userId);
    long countByEvent_Id(Long eventId);
}

