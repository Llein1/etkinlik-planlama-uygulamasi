package com.works.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserRegisterRequestDto {
    @NotNull
    @Size(min = 2, max = 120)
    @NotEmpty
    String name;

    @NotNull
    @Email
    @NotEmpty
    String email;

    @NotNull
    @Size(min = 6, max = 15)
    @NotEmpty
    String password;
}

