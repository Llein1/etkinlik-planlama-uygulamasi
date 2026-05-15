package com.works.backend.controller;

import com.works.backend.dto.UserLoginRequestDto;
import com.works.backend.dto.UserRegisterRequestDto;
import com.works.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("user")
public class UserRestController {

    final UserService userService;

    @PostMapping("register")
    public ResponseEntity register(@Valid @RequestBody UserRegisterRequestDto userRegisterRequestDto) {
        return userService.register(userRegisterRequestDto);
    }

    @PostMapping("login")
    public ResponseEntity login(@Valid @RequestBody UserLoginRequestDto userLoginRequestDto) {
        return userService.login(userLoginRequestDto);
    }

    @GetMapping("logout")
    public ResponseEntity logout() {
        return userService.logout();
    }
}


