package com.works.backend.controller;

import com.works.backend.dto.EventResponseDto;
import com.works.backend.dto.FavoriteEventRequestDto;
import com.works.backend.service.EventFavoriteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("favorite")
public class EventFavoriteRestController {

    final EventFavoriteService eventFavoriteService;

    @PostMapping("add")
    public ResponseEntity add(@Valid @RequestBody FavoriteEventRequestDto favoriteEventRequestDto) {
        return eventFavoriteService.add(favoriteEventRequestDto);
    }

    @DeleteMapping("remove/{eventId}")
    public ResponseEntity remove(@PathVariable Long eventId) {
        return eventFavoriteService.remove(eventId);
    }

    @GetMapping("my")
    public Page<EventResponseDto> listMy(@RequestParam(defaultValue = "0") int page) {
        return eventFavoriteService.listMyFavorites(page);
    }
}

