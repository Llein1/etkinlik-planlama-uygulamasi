package com.works.backend.service;

import com.works.backend.dto.EventResponseDto;
import com.works.backend.dto.JoinEventRequestDto;
import com.works.backend.dto.ParticipantResponseDto;
import com.works.backend.dto.UserResponseDto;
import com.works.backend.entity.Event;
import com.works.backend.entity.EventParticipant;
import com.works.backend.entity.User;
import com.works.backend.repository.EventParticipantRepository;
import com.works.backend.repository.EventRepository;
import com.works.backend.repository.UserRepository;
import com.works.backend.repository.EventFavoriteRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import com.works.backend.util.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.HashSet;

@Service
@RequiredArgsConstructor
public class EventParticipantService {

    final EventParticipantRepository eventParticipantRepository;
    final EventRepository eventRepository;
    final UserRepository userRepository;
    final EventFavoriteRepository eventFavoriteRepository;
    final HttpServletRequest request;
    final ModelMapper model;

    public ResponseEntity join(JoinEventRequestDto joinEventRequestDto) {
        Optional<User> optionalUser = getSessionUser();
        if (optionalUser.isEmpty()) {
            Map<String, Object> hm = Map.of("success", false, "message", "Unauthorized.");
            return ResponseEntity.status(401).body(hm);
        }
        Optional<Event> optionalEvent = eventRepository.findById(joinEventRequestDto.getEventId());
        if (optionalEvent.isEmpty()) {
            Map<String, Object> hm = Map.of("success", false, "message", "Event not found.");
            return ResponseEntity.status(404).body(hm);
        }
        if (optionalEvent.get().getStatus() != EventStatus.PUBLISHED) {
            Map<String, Object> hm = Map.of("success", false, "message", "Event is not published.");
            return ResponseEntity.badRequest().body(hm);
        }
        boolean isExists = eventParticipantRepository.existsByEvent_IdAndUser_Id(
                joinEventRequestDto.getEventId(),
                optionalUser.get().getId()
        );
        if (isExists) {
            Map<String, Object> hm = Map.of("success", false, "message", "You already joined this event.");
            return ResponseEntity.badRequest().body(hm);
        }
        EventParticipant eventParticipant = new EventParticipant();
        eventParticipant.setEvent(optionalEvent.get());
        eventParticipant.setUser(optionalUser.get());
        eventParticipantRepository.save(eventParticipant);
        Map<String, Object> hm = Map.of("success", true, "message", "Joined successfully.");
        return ResponseEntity.ok().body(hm);
    }

    @Transactional
    public ResponseEntity leave(Long eventId) {
        Optional<User> optionalUser = getSessionUser();
        if (optionalUser.isEmpty()) {
            Map<String, Object> hm = Map.of("success", false, "message", "Unauthorized.");
            return ResponseEntity.status(401).body(hm);
        }
        Optional<Event> optionalEvent = eventRepository.findById(eventId);
        if (optionalEvent.isEmpty()) {
            Map<String, Object> hm = Map.of("success", false, "message", "Event not found.");
            return ResponseEntity.status(404).body(hm);
        }
        boolean isExists = eventParticipantRepository.existsByEvent_IdAndUser_Id(eventId, optionalUser.get().getId());
        if (!isExists) {
            Map<String, Object> hm = Map.of("success", false, "message", "Participation not found.");
            return ResponseEntity.status(404).body(hm);
        }
        eventParticipantRepository.deleteByEvent_IdAndUser_Id(eventId, optionalUser.get().getId());
        Map<String, Object> hm = Map.of("success", true, "message", "Left successfully.");
        return ResponseEntity.ok().body(hm);
    }

    public ResponseEntity listParticipants(Long eventId) {
        List<EventParticipant> participants = eventParticipantRepository.findByEvent_Id(eventId);
        List<ParticipantResponseDto> responseDtos = participants.stream()
                .map(participant -> {
                    ParticipantResponseDto dto = model.map(participant.getUser(), ParticipantResponseDto.class);
                    dto.setUserId(participant.getUser().getId());
                    return dto;
                })
                .toList();
        return ResponseEntity.ok().body(responseDtos);
    }

    public Page<EventResponseDto> listMyParticipations(int page) {
        Optional<User> optionalUser = getSessionUser();
        if (optionalUser.isEmpty()) {
            return Page.empty();
        }
        Pageable pageable = Pageable.ofSize(9).withPage(page);
        Set<Long> favoriteEventIds =
                getFavoriteEventIds(optionalUser.get().getId());
        Page<EventParticipant> participants =
                eventParticipantRepository.findByUser_Id(
                        optionalUser.get().getId(),
                        pageable
                );
        return participants.map(participant ->
                toEventResponse(
                        participant.getEvent(),
                        favoriteEventIds
                )
        );
    }

    private Optional<User> getSessionUser() {
        Object sessionUser = request.getSession().getAttribute("user");
        if (sessionUser instanceof UserResponseDto userResponseDto) {
            return userRepository.findById(userResponseDto.getId());
        }
        return Optional.empty();
    }

    private EventResponseDto toEventResponse(Event event, Set<Long> favoriteEventIds) {
        EventResponseDto responseDto = model.map(event, EventResponseDto.class);
        responseDto.setOwnerId(event.getOwner().getId());
        responseDto.setOwnerName(event.getOwner().getName());
        responseDto.setIsFavorite(favoriteEventIds.contains(event.getId()));
        return responseDto;
    }

    private Set<Long> getFavoriteEventIds(Long userId) {
        List<Long> eventIds = eventFavoriteRepository.findEventIdsByUserId(userId);
        return new HashSet<>(eventIds);
    }
}
