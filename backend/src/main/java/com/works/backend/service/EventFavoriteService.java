package com.works.backend.service;

import com.works.backend.dto.EventResponseDto;
import com.works.backend.dto.FavoriteEventRequestDto;
import com.works.backend.dto.UserResponseDto;
import com.works.backend.entity.Event;
import com.works.backend.entity.EventFavorite;
import com.works.backend.entity.User;
import com.works.backend.repository.EventFavoriteRepository;
import com.works.backend.repository.EventRepository;
import com.works.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.CacheEvict;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EventFavoriteService {

    final EventFavoriteRepository eventFavoriteRepository;
    final EventRepository eventRepository;
    final UserRepository userRepository;
    final HttpServletRequest request;
    final ModelMapper model;

    @CacheEvict(cacheNames = {"eventListCache", "eventSearchCache", "eventOwnerListCache"}, allEntries = true)
    public ResponseEntity add(FavoriteEventRequestDto favoriteEventRequestDto) {
        Optional<User> optionalUser = getSessionUser();
        if (optionalUser.isEmpty()) {
            Map<String, Object> hm = Map.of("success", false, "message", "Oturum bulunamadı.");
            return ResponseEntity.status(401).body(hm);
        }
        Optional<Event> optionalEvent = eventRepository.findById(favoriteEventRequestDto.getEventId());
        if (optionalEvent.isEmpty()) {
            Map<String, Object> hm = Map.of("success", false, "message", "Etkinlik bulunamadı.");
            return ResponseEntity.status(404).body(hm);
        }
        boolean isExists = eventFavoriteRepository.existsByEvent_IdAndUser_Id(
                favoriteEventRequestDto.getEventId(),
                optionalUser.get().getId()
        );
        if (isExists) {
            Map<String, Object> hm = Map.of("success", false, "message", "Etkinlik zaten favorilerinizde.");
            return ResponseEntity.badRequest().body(hm);
        }
        EventFavorite eventFavorite = new EventFavorite();
        eventFavorite.setEvent(optionalEvent.get());
        eventFavorite.setUser(optionalUser.get());
        eventFavoriteRepository.save(eventFavorite);
        Map<String, Object> hm = Map.of("success", true, "message", "Etkinlik favorilerinize eklendi.");
        return ResponseEntity.ok().body(hm);
    }

    @Transactional
    @CacheEvict(cacheNames = {"eventListCache", "eventSearchCache", "eventOwnerListCache"}, allEntries = true)
    public ResponseEntity remove(Long eventId) {
        Optional<User> optionalUser = getSessionUser();
        if (optionalUser.isEmpty()) {
            Map<String, Object> hm = Map.of("success", false, "message", "Oturum bulunamadı.");
            return ResponseEntity.status(401).body(hm);
        }
        boolean isExists = eventFavoriteRepository.existsByEvent_IdAndUser_Id(eventId, optionalUser.get().getId());
        if (!isExists) {
            Map<String, Object> hm = Map.of("success", false, "message", "Etkinlik favorilerde bulunamadı.");
            return ResponseEntity.status(404).body(hm);
        }
        eventFavoriteRepository.deleteByEvent_IdAndUser_Id(eventId, optionalUser.get().getId());
        Map<String, Object> hm = Map.of("success", true, "message", "Etkinlik favorilerinizden çıkartıldı.");
        return ResponseEntity.ok().body(hm);
    }

    public Page<EventResponseDto> listMyFavorites(int page) {
        Optional<User> optionalUser = getSessionUser();
        if (optionalUser.isEmpty()) {
            return Page.empty();
        }
        Pageable pageable = Pageable.ofSize(9).withPage(page);
        Page<EventFavorite> favorites =
                eventFavoriteRepository.findByUser_Id(
                        optionalUser.get().getId(),
                        pageable
                );
        return favorites.map(favorite ->
                toEventResponse(favorite.getEvent(), true)
        );
    }

    private Optional<User> getSessionUser() {
        Object sessionUser = request.getSession().getAttribute("user");
        if (sessionUser instanceof UserResponseDto userResponseDto) {
            return userRepository.findById(userResponseDto.getId());
        }
        return Optional.empty();
    }

    private EventResponseDto toEventResponse(Event event, boolean isFavorite) {
        EventResponseDto responseDto = model.map(event, EventResponseDto.class);
        responseDto.setOwnerId(event.getOwner().getId());
        responseDto.setOwnerName(event.getOwner().getName());
        responseDto.setIsFavorite(isFavorite);
        return responseDto;
    }
}
