package com.works.backend.service;

import com.works.backend.dto.EventCreateRequestDto;
import com.works.backend.dto.EventDetailResponseDto;
import com.works.backend.dto.EventResponseDto;
import com.works.backend.dto.EventUpdateRequestDto;
import com.works.backend.dto.UserResponseDto;
import com.works.backend.entity.Event;
import com.works.backend.entity.User;
import com.works.backend.repository.EventParticipantRepository;
import com.works.backend.repository.EventRepository;
import com.works.backend.repository.UserRepository;
import com.works.backend.util.EventStatus;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EventService {

    final EventRepository eventRepository;
    final EventParticipantRepository eventParticipantRepository;
    final UserRepository userRepository;
    final HttpServletRequest request;
    final ModelMapper model;

    public ResponseEntity create(EventCreateRequestDto eventCreateRequestDto) {
        Optional<User> optionalUser = getSessionUser();
        if (optionalUser.isEmpty()) {
            Map<String, Object> hm = Map.of("success", false, "message", "Unauthorized.");
            return ResponseEntity.status(401).body(hm);
        }
        Event event = model.map(eventCreateRequestDto, Event.class);
        event.setOwner(optionalUser.get());
        event.setStatus(EventStatus.PAUSED);
        event = eventRepository.save(event);
        return ResponseEntity.ok().body(toEventResponse(event));
    }

    public ResponseEntity update(EventUpdateRequestDto eventUpdateRequestDto) {
        Optional<User> optionalUser = getSessionUser();
        if (optionalUser.isEmpty()) {
            Map<String, Object> hm = Map.of("success", false, "message", "Unauthorized.");
            return ResponseEntity.status(401).body(hm);
        }
        Optional<Event> optionalEvent = eventRepository.findByIdAndOwner_Id(eventUpdateRequestDto.getId(), optionalUser.get().getId());
        if (optionalEvent.isPresent()) {
            Event event = optionalEvent.get();
            event.setTitle(eventUpdateRequestDto.getTitle());
            event.setDate(eventUpdateRequestDto.getDate());
            event.setTime(eventUpdateRequestDto.getTime());
            event.setLocation(eventUpdateRequestDto.getLocation());
            event.setDescription(eventUpdateRequestDto.getDescription());
            event.setCategory(eventUpdateRequestDto.getCategory());
            eventRepository.save(event);
            Map<String, Object> hm = Map.of("success", true, "message", "Event updated successfully.");
            return ResponseEntity.ok().body(hm);
        }
        Map<String, Object> hm = Map.of("success", false, "message", "Event not found.");
        return ResponseEntity.status(404).body(hm);
    }

    public ResponseEntity deleteOne(Long id) {
        Optional<User> optionalUser = getSessionUser();
        if (optionalUser.isEmpty()) {
            Map<String, Object> hm = Map.of("success", false, "message", "Unauthorized.");
            return ResponseEntity.status(401).body(hm);
        }
        Optional<Event> optionalEvent = eventRepository.findByIdAndOwner_Id(id, optionalUser.get().getId());
        if (optionalEvent.isPresent()) {
            eventRepository.deleteById(id);
            Map<String, Object> hm = Map.of("success", true, "message", "Event deleted successfully.");
            return ResponseEntity.ok().body(hm);
        }
        Map<String, Object> hm = Map.of("success", false, "message", "Event not found.");
        return ResponseEntity.status(404).body(hm);
    }

    public ResponseEntity publish(Long id) {
        return updateStatus(id, EventStatus.PUBLISHED, "Event published successfully.");
    }

    public ResponseEntity pause(Long id) {
        return updateStatus(id, EventStatus.PAUSED, "Event paused successfully.");
    }

    public ResponseEntity archive(Long id) {
        return updateStatus(id, EventStatus.ARCHIVED, "Event archived successfully.");
    }

    public ResponseEntity getDetail(Long id) {
        Optional<Event> optionalEvent = eventRepository.findById(id);
        if (optionalEvent.isEmpty()) {
            Map<String, Object> hm = Map.of("success", false, "message", "Event not found.");
            return ResponseEntity.status(404).body(hm);
        }
        Event event = optionalEvent.get();
        EventDetailResponseDto responseDto = model.map(event, EventDetailResponseDto.class);
        responseDto.setOwnerId(event.getOwner().getId());
        responseDto.setOwnerName(event.getOwner().getName());
        responseDto.setParticipantCount(eventParticipantRepository.countByEvent_Id(event.getId()));
        return ResponseEntity.ok().body(responseDto);
    }

    public Page<EventResponseDto> listPublished(int page) {
        Pageable pageable = Pageable.ofSize(10).withPage(page);
        return eventRepository.findByStatus(EventStatus.PUBLISHED, pageable)
                .map(this::toEventResponse);
    }

    public Page<EventResponseDto> listByOwner(int page) {
        Optional<User> optionalUser = getSessionUser();
        if (optionalUser.isEmpty()) {
            return Page.empty();
        }
        Pageable pageable = Pageable.ofSize(10).withPage(page);
        return eventRepository.findByOwner_Id(optionalUser.get().getId(), pageable)
                .map(this::toEventResponse);
    }

    public Page<EventResponseDto> search(String q, int page) {
        Pageable pageable = PageRequest.of(page, 10);
        return eventRepository.findByTitleContainsOrDescriptionContainsOrLocationContainsOrCategoryContainsAllIgnoreCase(
                        q, q, q, q, pageable)
                .map(this::toEventResponse);
    }

    private ResponseEntity updateStatus(Long id, EventStatus status, String message) {
        Optional<User> optionalUser = getSessionUser();
        if (optionalUser.isEmpty()) {
            Map<String, Object> hm = Map.of("success", false, "message", "Unauthorized.");
            return ResponseEntity.status(401).body(hm);
        }
        Optional<Event> optionalEvent = eventRepository.findByIdAndOwner_Id(id, optionalUser.get().getId());
        if (optionalEvent.isPresent()) {
            Event event = optionalEvent.get();
            event.setStatus(status);
            eventRepository.save(event);
            Map<String, Object> hm = Map.of("success", true, "message", message);
            return ResponseEntity.ok().body(hm);
        }
        Map<String, Object> hm = Map.of("success", false, "message", "Event not found.");
        return ResponseEntity.status(404).body(hm);
    }

    private Optional<User> getSessionUser() {
        Object sessionUser = request.getSession().getAttribute("user");
        if (sessionUser instanceof UserResponseDto userResponseDto) {
            return userRepository.findById(userResponseDto.getId());
        }
        return Optional.empty();
    }

    private EventResponseDto toEventResponse(Event event) {
        EventResponseDto responseDto = model.map(event, EventResponseDto.class);
        responseDto.setOwnerId(event.getOwner().getId());
        responseDto.setOwnerName(event.getOwner().getName());
        return responseDto;
    }
}

