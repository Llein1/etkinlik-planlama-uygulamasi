package com.works.backend.service;

import com.works.backend.dto.UserLoginRequestDto;
import com.works.backend.dto.UserRegisterRequestDto;
import com.works.backend.dto.UserResponseDto;
import com.works.backend.entity.User;
import com.works.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.mindrot.jbcrypt.BCrypt;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    final UserRepository userRepository;
    final HttpServletRequest request;
    final ModelMapper model;

    public ResponseEntity register(UserRegisterRequestDto userRegisterRequestDto) {
        boolean isExists = userRepository.existsByEmailEqualsIgnoreCase(userRegisterRequestDto.getEmail());
        if (isExists) {
            Map<String, Object> hm = Map.of("success", false, "message", "Bu mail adresi zaten kullanılıyor.");
            return ResponseEntity.badRequest().body(hm);
        }
        User user = model.map(userRegisterRequestDto, User.class);
        String hashPassword = BCrypt.hashpw(user.getPassword(), BCrypt.gensalt());
        user.setPassword(hashPassword);
        user = userRepository.save(user);
        UserResponseDto userResponseDto = model.map(user, UserResponseDto.class);
        return ResponseEntity.ok().body(userResponseDto);
    }

    public ResponseEntity login(UserLoginRequestDto userLoginRequestDto) {
        Optional<User> optionalUser = userRepository.findByEmailEqualsIgnoreCase(userLoginRequestDto.getEmail());
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            boolean isMatch = BCrypt.checkpw(userLoginRequestDto.getPassword(), user.getPassword());
            if (isMatch) {
                UserResponseDto userResponseDto = model.map(user, UserResponseDto.class);
                request.getSession().setAttribute("user", userResponseDto);
                return ResponseEntity.ok().body(userResponseDto);
            }
        }
        Map<String, Object> hm = Map.of("success", false, "message", "Email veya şifre yanlış.");
        return ResponseEntity.badRequest().body(hm);
    }

    public ResponseEntity logout() {
        request.getSession().invalidate();
        return ResponseEntity.ok().body("Başarıyla çıkış yapıldı.");
    }
}

