package com.example.game_api.gameapi.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data // Lombok: Generates getters, setters, toString, equals, hashCode
public class LoginRequest {
    @NotBlank
    private String username;

    @NotBlank
    private String password;
}