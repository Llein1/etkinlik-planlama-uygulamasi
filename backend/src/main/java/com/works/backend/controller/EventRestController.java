package com.works.backend.controller;

import com.works.backend.dto.EventCreateRequestDto;
import com.works.backend.dto.EventResponseDto;
import com.works.backend.dto.EventUpdateRequestDto;
import com.works.backend.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("event")
public class EventRestController {

    final EventService eventService;

    @PostMapping("create")
    public ResponseEntity create(@Valid @RequestBody EventCreateRequestDto eventCreateRequestDto) {
        return eventService.create(eventCreateRequestDto);
    }

    @PutMapping("update")
    public ResponseEntity update(@Valid @RequestBody EventUpdateRequestDto eventUpdateRequestDto) {
        return eventService.update(eventUpdateRequestDto);
    }

    @DeleteMapping("deleteOne/{id}")
    public ResponseEntity deleteOne(@PathVariable Long id) {
        return eventService.deleteOne(id);
    }

    @PutMapping("publish/{id}")
    public ResponseEntity publish(@PathVariable Long id) {
        return eventService.publish(id);
    }

    @PutMapping("pause/{id}")
    public ResponseEntity pause(@PathVariable Long id) {
        return eventService.pause(id);
    }

    @PutMapping("archive/{id}")
    public ResponseEntity archive(@PathVariable Long id) {
        return eventService.archive(id);
    }

    @GetMapping("detail/{id}")
    public ResponseEntity detail(@PathVariable Long id) {
        return eventService.getDetail(id);
    }

    @GetMapping("list")
    public Page<EventResponseDto> list(@RequestParam(defaultValue = "0") int page) {
        return eventService.listPublished(page);
    }

    @GetMapping("my")
    public Page<EventResponseDto> listMy(@RequestParam(defaultValue = "0") int page) {
        return eventService.listByOwner(page);
    }

    @GetMapping("search")
    public Page<EventResponseDto> search(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "") String q
    ) {
        return eventService.search(q, page);
    }

    @GetMapping("control")
    public void control() {}
}

