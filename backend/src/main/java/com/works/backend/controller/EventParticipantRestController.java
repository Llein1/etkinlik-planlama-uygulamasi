package com.works.backend.controller;

import com.works.backend.dto.EventResponseDto;
import com.works.backend.dto.JoinEventRequestDto;
import com.works.backend.service.EventParticipantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("participant")
public class EventParticipantRestController {

    final EventParticipantService eventParticipantService;

    @PostMapping("join")
    public ResponseEntity join(@Valid @RequestBody JoinEventRequestDto joinEventRequestDto) {
        return eventParticipantService.join(joinEventRequestDto);
    }

    @DeleteMapping("leave/{eventId}")
    public ResponseEntity leave(@PathVariable Long eventId) {
        return eventParticipantService.leave(eventId);
    }

    @GetMapping("list/{eventId}")
    public ResponseEntity list(@PathVariable Long eventId) {
        return eventParticipantService.listParticipants(eventId);
    }

    @GetMapping("my")
    public Page<EventResponseDto> listMy(@RequestParam(defaultValue = "0") int page) {
        return eventParticipantService.listMyParticipations(page);
    }
}

