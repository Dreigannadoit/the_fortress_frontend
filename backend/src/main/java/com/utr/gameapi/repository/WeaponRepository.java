package com.utr.gameapi.repository;

import com.utr.gameapi.entity.Weapon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WeaponRepository extends JpaRepository<Weapon, Long> {
    Optional<Weapon> findByName(String name);
    List<Weapon> findByUnlockable(boolean unlockable); // Find weapons available to players
}