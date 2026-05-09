package com.works.backend.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class EventUpdateRequestDto {
    @NotNull
    @Min(1)
    @Max(Long.MAX_VALUE)
    Long id;

    @NotNull
    @Size(min = 2, max = 150)
    @NotEmpty
    String title;

    @NotNull
    @FutureOrPresent
    LocalDate date;

    @NotNull
    LocalTime time;

    @NotNull
    @Size(min = 2, max = 200)
    @NotEmpty
    String location;

    @NotNull
    @Size(min = 2, max = 500)
    @NotEmpty
    String description;

    @NotNull
    @Size(min = 2, max = 100)
    @NotEmpty
    String category;
}
