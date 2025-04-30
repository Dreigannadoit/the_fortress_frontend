package com.example.game_api.gameapi.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_weapon_ownership",
        uniqueConstraints = { @UniqueConstraint(columnNames = {"user_id", "weapon_id"}) })
@Getter
@Setter
@NoArgsConstructor
public class UserWeaponOwnership {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "weapon_id", nullable = false)
    private Weapon weapon;

    public UserWeaponOwnership(User user, Weapon weapon) {
        this.user = user;
        this.weapon = weapon;
    }
}