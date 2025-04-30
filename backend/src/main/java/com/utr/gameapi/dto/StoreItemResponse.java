package com.example.game_api.gameapi.dto;

import lombok.Data;

// Generic DTO for items listed in the store
@Data
public class StoreItemResponse {
    private String id; // Weapon name or GameItem itemId
    private String name;
    private int price;
    private String description;
    private String category;
    private boolean available;
    // Add specific stats if needed for display, or keep it minimal
}
