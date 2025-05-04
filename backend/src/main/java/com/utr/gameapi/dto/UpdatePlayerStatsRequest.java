package com.utr.gameapi.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class UpdatePlayerStatsRequest {
    @NotNull
    private Integer currency;
    @NotNull
    private Float level;
    @NotNull
    private Integer kills;
    @NotNull
    private Integer sessionScore;
    private String currentWeaponName;
    private List<String> activeSkillIds;
}
