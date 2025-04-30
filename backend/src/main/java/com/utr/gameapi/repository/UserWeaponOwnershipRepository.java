package com.utr.gameapi.repository;

import com.utr.gameapi.entity.User;
import com.utr.gameapi.entity.UserWeaponOwnership;
import com.utr.gameapi.entity.Weapon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserWeaponOwnershipRepository extends JpaRepository<UserWeaponOwnership, Long> {
    List<UserWeaponOwnership> findByUser(User user);
    Optional<UserWeaponOwnership> findByUserAndWeapon(User user, Weapon weapon);
    boolean existsByUserAndWeapon(User user, Weapon weapon);
    boolean existsByUserAndWeapon_Name(User user, String weaponName); // Check ownership by weapon name
    boolean existsByUser_UsernameAndWeapon_Name(String username, String weaponName);
}