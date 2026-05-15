package com.works.backend.dto;

import com.works.backend.util.EventStatus;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class EventResponseDto {
    Long id;
    String title;
    LocalDate date;
    LocalTime time;
    String location;
    String category;
    EventStatus status;
    Long ownerId;
    String ownerName;
    Boolean isFavorite;
}
