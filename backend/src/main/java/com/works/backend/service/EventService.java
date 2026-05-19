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
import com.works.backend.repository.EventFavoriteRepository;
import com.works.backend.util.EventStatus;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Locale;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;
import java.util.Set;
import java.util.HashSet;

@Service
@RequiredArgsConstructor
public class EventService {

    final EventRepository eventRepository;
    final EventParticipantRepository eventParticipantRepository;
    final UserRepository userRepository;
    final EventFavoriteRepository eventFavoriteRepository;
    final HttpServletRequest request;
    final ModelMapper model;

    @CacheEvict(cacheNames = {"eventListCache", "eventSearchCache", "eventOwnerListCache"}, allEntries = true)
    public ResponseEntity create(EventCreateRequestDto eventCreateRequestDto) {
        Optional<User> optionalUser = getSessionUser();
        if (optionalUser.isEmpty()) {
            Map<String, Object> hm = Map.of("success", false, "message", "Oturum bulunamadı.");
            return ResponseEntity.status(401).body(hm);
        }
        ResponseEntity validation = validateEventDateTime(eventCreateRequestDto.getDate(), eventCreateRequestDto.getTime());
        if (validation != null) {
            return validation;
        }
        Event event = model.map(eventCreateRequestDto, Event.class);
        event.setOwner(optionalUser.get());
        event.setStatus(EventStatus.PUBLISHED);
        event = eventRepository.save(event);
        return ResponseEntity.ok().body(toEventResponse(event, Set.of()));
    }

    @CacheEvict(cacheNames = {"eventListCache", "eventSearchCache", "eventOwnerListCache"}, allEntries = true)
    public ResponseEntity update(EventUpdateRequestDto eventUpdateRequestDto) {
        Optional<User> optionalUser = getSessionUser();
        if (optionalUser.isEmpty()) {
            Map<String, Object> hm = Map.of("success", false, "message", "Oturum bulunamadı.");
            return ResponseEntity.status(401).body(hm);
        }
        ResponseEntity validation = validateEventDateTime(eventUpdateRequestDto.getDate(), eventUpdateRequestDto.getTime());
        if (validation != null) {
            return validation;
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
            Map<String, Object> hm = Map.of("success", true, "message", "Etkinlik başarıyla güncellendi.");
            return ResponseEntity.ok().body(hm);
        }
        Map<String, Object> hm = Map.of("success", false, "message", "Etkinlik bulunamadı.");
        return ResponseEntity.status(404).body(hm);
    }

    @CacheEvict(cacheNames = {"eventListCache", "eventSearchCache", "eventOwnerListCache"}, allEntries = true)
    @Transactional
    public ResponseEntity deleteOne(Long id) {
        Optional<User> optionalUser = getSessionUser();
        if (optionalUser.isEmpty()) {
            Map<String, Object> hm = Map.of("success", false, "message", "Oturum bulunamadı.");
            return ResponseEntity.status(401).body(hm);
        }
        Optional<Event> optionalEvent = eventRepository.findByIdAndOwner_Id(id, optionalUser.get().getId());
        if (optionalEvent.isPresent()) {
            // remove dependent child rows to satisfy FK constraints
            eventParticipantRepository.deleteByEvent_Id(id);
            eventFavoriteRepository.deleteByEvent_Id(id);
            eventRepository.deleteById(id);
            Map<String, Object> hm = Map.of("success", true, "message", "Etkinliği silme işlemi başarılı.");
            return ResponseEntity.ok().body(hm);
        }
        Map<String, Object> hm = Map.of("success", false, "message", "Etkinlik bulunamadı.");
        return ResponseEntity.status(404).body(hm);
    }

    @CacheEvict(cacheNames = {"eventListCache", "eventSearchCache", "eventOwnerListCache"}, allEntries = true)
    public ResponseEntity publish(Long id) {
        return updateStatus(id, EventStatus.PUBLISHED, "Etkinlik başarıyla yayınlandı.");
    }

    @CacheEvict(cacheNames = {"eventListCache", "eventSearchCache", "eventOwnerListCache"}, allEntries = true)
    public ResponseEntity pause(Long id) {
        return updateStatus(id, EventStatus.PAUSED, "Etkinlik başarıyla duraklatıldı.");
    }

    @CacheEvict(cacheNames = {"eventListCache", "eventSearchCache", "eventOwnerListCache"}, allEntries = true)
    public ResponseEntity archive(Long id) {
        return updateStatus(id, EventStatus.ARCHIVED, "Etkinlik başarıyla arşivlendi.");
    }

    public ResponseEntity getDetail(Long id) {
        Optional<Event> optionalEvent = eventRepository.findById(id);
        if (optionalEvent.isEmpty()) {
            Map<String, Object> hm = Map.of("success", false, "message", "Etkinlik bulunamadı.");
            return ResponseEntity.status(404).body(hm);
        }
        Event event = optionalEvent.get();
        EventDetailResponseDto responseDto = model.map(event, EventDetailResponseDto.class);
        responseDto.setOwnerId(event.getOwner().getId());
        responseDto.setOwnerName(event.getOwner().getName());
        responseDto.setParticipantCount(eventParticipantRepository.countByEvent_Id(event.getId()));
        responseDto.setIsFavorite(isFavoriteForSessionUser(event.getId()));
        return ResponseEntity.ok().body(responseDto);
    }

    @Cacheable(cacheNames = "eventListCache", key = "#page + '-' + #root.target.getSessionUserId()")
    public Page<EventResponseDto> listPublished(int page) {
        Pageable pageable = Pageable.ofSize(9).withPage(page);
        Set<Long> favoriteEventIds = getFavoriteEventIds(getSessionUser());
        return eventRepository.findByStatus(EventStatus.PUBLISHED, pageable)
                .map(event -> toEventResponse(event, favoriteEventIds));
    }

    @Cacheable(cacheNames = "eventSearchCache", key = "#q + '-' + #page + '-' + #sort + '-' + (#status == null ? '' : #status) + '-' + #root.target.getSessionUserId()")
    public Page<EventResponseDto> search(String q, int page, String sort, String status) {
        Sort.Direction direction =
                "desc".equalsIgnoreCase(sort) ? Sort.Direction.DESC : Sort.Direction.ASC;

        Pageable pageable = PageRequest.of(page, 9, Sort.by(direction, "date", "time"));
        Set<Long> favoriteEventIds = getFavoriteEventIds(getSessionUser());
        EventStatus eventStatus = parseEventStatus(status);

        if (eventStatus == null) {
            return eventRepository.findByTitleContainsOrDescriptionContainsOrLocationContainsOrCategoryContainsAllIgnoreCase(
                            q, q, q, q, pageable)
                    .map(event -> toEventResponse(event, favoriteEventIds));
        }

        return eventRepository.findByStatusAndTitleContainsIgnoreCaseOrStatusAndDescriptionContainsIgnoreCaseOrStatusAndLocationContainsIgnoreCaseOrStatusAndCategoryContainsIgnoreCase(
                        eventStatus, q,
                        eventStatus, q,
                        eventStatus, q,
                        eventStatus, q,
                        pageable)
                .map(event -> toEventResponse(event, favoriteEventIds));
    }

    @Cacheable(cacheNames = "eventOwnerListCache", key = "#page + '-' + #root.target.getSessionUserId()")
    public Page<EventResponseDto> listByOwner(int page) {
        Optional<User> optionalUser = getSessionUser();
        if (optionalUser.isEmpty()) {
            return Page.empty();
        }
        Pageable pageable = Pageable.ofSize(9).withPage(page);
        Set<Long> favoriteEventIds = getFavoriteEventIds(optionalUser);
        return eventRepository.findByOwner_Id(optionalUser.get().getId(), pageable)
                .map(event -> toEventResponse(event, favoriteEventIds));
    }

    @CacheEvict(cacheNames = {"eventListCache", "eventSearchCache", "eventOwnerListCache"}, allEntries = true)
    public void archiveExpiredEvents() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        List<Event> expiredByDate = eventRepository.findByStatusInAndDateBefore(
                List.of(EventStatus.PUBLISHED, EventStatus.PAUSED),
                today
        );
        List<Event> expiredByTime = eventRepository.findByStatusInAndDateEqualsAndTimeBefore(
                List.of(EventStatus.PUBLISHED, EventStatus.PAUSED),
                today,
                now
        );
        List<Event> expiredEvents = Stream.concat(expiredByDate.stream(), expiredByTime.stream())
                .distinct()
                .toList();
        if (!expiredEvents.isEmpty()) {
            expiredEvents.forEach(event -> event.setStatus(EventStatus.ARCHIVED));
            eventRepository.saveAll(expiredEvents);
        }
    }

    private ResponseEntity updateStatus(Long id, EventStatus status, String message) {
        Optional<User> optionalUser = getSessionUser();
        if (optionalUser.isEmpty()) {
            Map<String, Object> hm = Map.of("success", false, "message", "Oturum bulunamadı.");
            return ResponseEntity.status(401).body(hm);
        }
        Optional<Event> optionalEvent = eventRepository.findByIdAndOwner_Id(id, optionalUser.get().getId());
        if (optionalEvent.isPresent()) {
            Event event = optionalEvent.get();
            if (event.getStatus() == EventStatus.ARCHIVED && status != EventStatus.ARCHIVED) {
                Map<String, Object> hm = Map.of("success", false, "message", "Arşivlenmiş etkinlikler değiştirilemez.");
                return ResponseEntity.badRequest().body(hm);
            }
            if (isEventExpired(event) && (status == EventStatus.PUBLISHED || status == EventStatus.PAUSED)) {
                Map<String, Object> hm = Map.of("success", false, "message", "Süresi dolmuş etkinliklerin durumu değiştirilemez.");
                return ResponseEntity.badRequest().body(hm);
            }
            event.setStatus(status);
            eventRepository.save(event);
            Map<String, Object> hm = Map.of("success", true, "message", message);
            return ResponseEntity.ok().body(hm);
        }
        Map<String, Object> hm = Map.of("success", false, "message", "Etkinlik bulunamadı.");
        return ResponseEntity.status(404).body(hm);
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

    private Set<Long> getFavoriteEventIds(Optional<User> optionalUser) {
        if (optionalUser.isEmpty()) {
            return Set.of();
        }
        List<Long> eventIds = eventFavoriteRepository.findEventIdsByUserId(optionalUser.get().getId());
        return new HashSet<>(eventIds);
    }

    private boolean isFavoriteForSessionUser(Long eventId) {
        Optional<User> optionalUser = getSessionUser();
        if (optionalUser.isEmpty()) {
            return false;
        }
        return eventFavoriteRepository.existsByEvent_IdAndUser_Id(eventId, optionalUser.get().getId());
    }

    private boolean isEventExpired(Event event) {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        if (event.getDate() == null || event.getTime() == null) {
            return false;
        }
        return event.getDate().isBefore(today)
                || (event.getDate().isEqual(today) && event.getTime().isBefore(now));
    }

    private EventStatus parseEventStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return EventStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private ResponseEntity validateEventDateTime(LocalDate date, LocalTime time) {
        if (date == null || time == null) {
            return null;
        }
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        if (date.isBefore(today) || (date.isEqual(today) && !time.isAfter(now))) {
            Map<String, Object> hm = Map.of("success", false, "message", "Gelecek bir tarih/saat seçilmelidir.");
            return ResponseEntity.badRequest().body(hm);
        }
        return null;
    }

    public Long getSessionUserId() {
        return getSessionUser().map(User::getId).orElse(0L);
    }
}
