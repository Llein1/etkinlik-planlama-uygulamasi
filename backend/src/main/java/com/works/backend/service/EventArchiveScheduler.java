package com.works.backend.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EventArchiveScheduler {

    final EventService eventService;

    @Scheduled(cron = "0 0 2 * * *")
    public void archiveExpiredEvents() {
        eventService.archiveExpiredEvents();
    }

    @PostConstruct
    public void archiveExpiredEventsOnStartup() {
        eventService.archiveExpiredEvents();
    }
}
