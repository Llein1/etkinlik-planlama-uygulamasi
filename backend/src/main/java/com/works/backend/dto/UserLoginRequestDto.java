package com.works.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserLoginRequestDto {

    @NotNull
    @Email
    @NotEmpty
    @Size(min = 5, max = 150)
    String email;

    @NotNull
    @NotEmpty
    @Size(min = 6, max = 15)
    String password;
}

