package com.example.game_api.gameapi.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PurchaseRequest {
    @NotBlank
    private String itemId; // Can be weapon name or GameItem itemId
    @NotBlank
    private String category; // "weapons", "turrets", "skills", etc.
}
