package com.utr.gameapi.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class UpdatePlayerStatsRequest { // For saving game progress
    @NotNull // Use NotNull for primitives, NotBlank for Strings
    private Integer currency;
    @NotNull
    private Float level;
    @NotNull
    private Integer kills;
    private String currentWeaponName; // Optional update
    private List<String> activeSkillIds; // Optional update
    // Include owned items if game session can unlock items directly
}
