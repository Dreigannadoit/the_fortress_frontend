package com.utr.gameapi.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "player_stats")
@Getter
@Setter
@NoArgsConstructor
public class PlayerStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "kills", nullable = false, columnDefinition = "INT DEFAULT 0")
    private int kills = 0; // Renamed from 'Amount of kills'

    @Column(name = "level", nullable = false, columnDefinition = "FLOAT DEFAULT 1.0")
    private float level = 1.0f; // Renamed from 'Current Level'

    @Column(name = "currency", nullable = false, columnDefinition = "INT DEFAULT 0")
    private int currency = 0; // Renamed from 'currency_amount'

    @Column(name = "current_weapon_name") // Store the *name* or *ID* of the weapon
    private String currentWeaponName = "pistol"; // Default weapon

    @ElementCollection(fetch = FetchType.EAGER) // Store list of active skill identifiers
    @CollectionTable(name = "player_active_skills", joinColumns = @JoinColumn(name = "player_stats_id"))
    @Column(name = "skill_id")
    private List<String> activeSkillIds = new ArrayList<>(); // Map to item IDs like 'recovery', 'defense_orb'

    // --- Relationships ---
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true) // Foreign key column
    private User user;

    // Constructor
    public PlayerStats(User user) {
        this.user = user;
        // Set default values if needed, already done via field initializers & columnDefinition
    }
}