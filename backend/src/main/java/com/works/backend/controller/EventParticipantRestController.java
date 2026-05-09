package com.works.backend.controller;

import com.works.backend.dto.JoinEventRequestDto;
import com.works.backend.service.EventParticipantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

    @GetMapping("list/{eventId}")
    public ResponseEntity list(@PathVariable Long eventId) {
        return eventParticipantService.listParticipants(eventId);
    }

    @GetMapping("my")
    public ResponseEntity listMy() {
        return eventParticipantService.listMyParticipations();
    }
}

