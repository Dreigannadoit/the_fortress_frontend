package com.utr.gameapi.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "game_items", uniqueConstraints = {
        @UniqueConstraint(columnNames = "itemId")
})
@Getter
@Setter
@NoArgsConstructor
public class GameItem { // Generic table for various item types

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, unique = true)
    private String itemId; // Unique identifier (e.g., "basic_turret", "recovery", "attack_orb")

    @NotBlank
    @Column(nullable = false)
    private String name; // Display name (e.g., "Basic Turret", "Recovery")

    @NotBlank
    @Column(nullable = false)
    private String category; // "turrets", "drones", "skills", "orbs", "ultimates"

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, columnDefinition = "INT DEFAULT 0")
    @PositiveOrZero
    private int price = 0;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT TRUE")
    private boolean available = true; // Is it available in the store?

    // --- Type-Specific Stats (using JSON or separate tables might be more normalized,
    // --- but this is simpler for fewer distinct stats) ---

    // Turret Stats
    private Float turretSpread;
    private Integer turretBulletSpeed;
    private Integer turretDamage;
    private Integer turretFireRate;
    private Integer turretRange;

    // Drone Stats
    private Integer droneAttackRange;
    private Integer droneDamage;
    private Integer droneDuration;

    // Add other stats for skills, orbs etc. if needed directly here, or link to other tables.
}