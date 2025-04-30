package com.utr.gameapi.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "weapons")
@Getter
@Setter
@NoArgsConstructor
public class Weapon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Internal DB ID

    @NotBlank
    @Column(nullable = false, unique = true)
    private String name; // e.g., "pistol", "shotgun". Used as identifier.

    @Column(nullable = false)
    @PositiveOrZero
    private int damage;

    @Column(nullable = false, columnDefinition = "INT DEFAULT 1")
    @PositiveOrZero
    private int pellets = 1;

    @Column(nullable = false, columnDefinition = "FLOAT DEFAULT 0.0")
    @PositiveOrZero
    private float spread = 0.0f;

    @Column(nullable = false)
    @PositiveOrZero
    private int rangeValue; // Renamed from 'range' as 'range' can be SQL keyword

    @Column(nullable = false)
    @PositiveOrZero
    private int bulletSpeed;

    @Column(nullable = false)
    @PositiveOrZero
    private int bulletSize;

    @Column(nullable = false)
    @PositiveOrZero
    private int maxAmmo;

    @Column(nullable = false)
    @PositiveOrZero
    private int reloadDuration; // in milliseconds

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean automatic = false; // Renamed from isAutomatic

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean unlockable = true; // Can this weapon be obtained by players? (vs. dev only?)

    @Column(nullable = false)
    @PositiveOrZero
    private int recoilForce;

    // --- Store Related Fields ---
    @Column(nullable = false, columnDefinition = "INT DEFAULT 0")
    @PositiveOrZero
    private int price = 0;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Note: isOwned and isUnlocked are USER-SPECIFIC, not part of the weapon definition.
    // They will be determined via the UserWeaponOwnership table.
}