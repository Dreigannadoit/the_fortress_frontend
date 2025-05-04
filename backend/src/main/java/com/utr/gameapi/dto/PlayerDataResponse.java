package com.utr.gameapi.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Data
public class PlayerDataResponse {
    private int currency;
    private float level;
    private int kills;
    private int highestScore;
    private String currentWeaponName;
    private Set<String> ownedWeaponNames; // Just the names/ids
    private Map<String, Set<String>> ownedItemsByCategory; // e.g., {"turrets": ["basic_turret"], "skills": ["recovery"]}
    private List<String> activeSkillIds;
}

// NOTE: Need to add another mapping for levels later :(