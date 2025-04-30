package com.example.game_api.gameapi.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users", // Ensure table name matches SQL conventions if needed
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "username")
        })
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 50)
    @Column(nullable = false, unique = true)
    private String username;

    @NotBlank
    @Size(max = 120) // Store hashed password
    @Column(nullable = false)
    private String password;

    // --- Relationships ---

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY, optional = false)
    private PlayerStats playerStats;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserWeaponOwnership> ownedWeapons = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserItemOwnership> ownedItems = new HashSet<>(); // For Turrets, Drones, Skills, Orbs etc.

    // Convenience constructor
    public User(String username, String password) {
        this.username = username;
        this.password = password;
    }

    // Helper methods for managing bidirectional relationships (optional but good practice)
    public void setPlayerStats(PlayerStats playerStats) {
        if (playerStats == null) {
            if (this.playerStats != null) {
                this.playerStats.setUser(null);
            }
        } else {
            playerStats.setUser(this);
        }
        this.playerStats = playerStats;
    }

    public void addOwnedWeapon(UserWeaponOwnership ownership) {
        ownedWeapons.add(ownership);
        ownership.setUser(this);
    }

    public void removeOwnedWeapon(UserWeaponOwnership ownership) {
        ownedWeapons.remove(ownership);
        ownership.setUser(null);
    }

    public void addOwnedItem(UserItemOwnership ownership) {
        ownedItems.add(ownership);
        ownership.setUser(this);
    }
    public void removeOwnedItem(UserItemOwnership ownership) {
        ownedItems.remove(ownership);
        ownership.setUser(null);
    }
}