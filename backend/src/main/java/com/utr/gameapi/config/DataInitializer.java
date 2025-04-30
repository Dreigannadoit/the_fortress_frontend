package com.example.game_api.gameapi.config;

import com.example.game_api.gameapi.entity.GameItem;
import com.example.game_api.gameapi.entity.Weapon;
import com.example.game_api.gameapi.repository.GameItemRepository;
import com.example.game_api.gameapi.repository.WeaponRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private WeaponRepository weaponRepository;

    @Autowired
    private GameItemRepository gameItemRepository;

    @Override
    @Transactional // Ensure operations run in a transaction
    public void run(String... args) throws Exception {
        System.out.println("Checking for initial data...");

        // --- Weapons ---
        if (weaponRepository.count() == 0) {
            System.out.println("Initializing weapons...");
            Weapon pistol = new Weapon();
            pistol.setName("pistol");
            pistol.setDamage(15);
            pistol.setRangeValue(1000);
            pistol.setBulletSpeed(12);
            pistol.setBulletSize(15);
            pistol.setMaxAmmo(15);
            pistol.setReloadDuration(1500);
            pistol.setAutomatic(false);
            pistol.setUnlockable(true); // Pistol is default, but still mark as unlockable concept
            pistol.setRecoilForce(1); // Adjusted example value
            pistol.setPrice(0); // Default weapon
            pistol.setDescription("Standard sidearm.");
            pistol.setPellets(1);
            pistol.setSpread(0);

            Weapon shotgun = new Weapon();
            shotgun.setName("shotgun");
            shotgun.setDamage(35); // Per pellet
            shotgun.setPellets(8);
            shotgun.setSpread((float) (Math.PI / 12));
            shotgun.setRangeValue(305);
            shotgun.setBulletSpeed(18);
            shotgun.setBulletSize(12);
            shotgun.setMaxAmmo(8);
            shotgun.setReloadDuration(2500);
            shotgun.setAutomatic(false);
            shotgun.setUnlockable(true);
            shotgun.setRecoilForce(15);
            shotgun.setPrice(500); // From your Store.js
            shotgun.setDescription("Wide spread, high damage at close range");

            Weapon machinegun = new Weapon();
            machinegun.setName("machinegun");
            machinegun.setDamage(30);
            machinegun.setRangeValue(500);
            machinegun.setBulletSpeed(20);
            machinegun.setBulletSize(10);
            machinegun.setMaxAmmo(100);
            machinegun.setReloadDuration(3000);
            machinegun.setAutomatic(true);
            machinegun.setUnlockable(true);
            machinegun.setRecoilForce(3);
            machinegun.setPrice(800); // From your Store.js
            machinegun.setDescription("Rapid fire with moderate damage");
            machinegun.setPellets(1);
            machinegun.setSpread(0);

            weaponRepository.saveAll(Arrays.asList(pistol, shotgun, machinegun));
            System.out.println("Weapons initialized.");
        } else {
            System.out.println("Weapons already exist.");
        }


        // --- Game Items (Turrets, Skills, Orbs, etc.) ---
        if (gameItemRepository.count() == 0) {
            System.out.println("Initializing game items...");

            // Turrets
            GameItem basicTurret = new GameItem();
            basicTurret.setItemId("basic_turret");
            basicTurret.setName("Basic Turret");
            basicTurret.setCategory("turrets");
            basicTurret.setDescription("Automatic targeting with moderate damage");
            basicTurret.setPrice(1000);
            basicTurret.setAvailable(true);
            // Add turret-specific stats if needed, e.g., basicTurret.setTurretDamage(15);

            GameItem sniperTurret = new GameItem();
            sniperTurret.setItemId("sniper_turret");
            sniperTurret.setName("Sniper Turret");
            sniperTurret.setCategory("turrets");
            sniperTurret.setDescription("High damage, low rate of fire");
            sniperTurret.setPrice(1500);
            sniperTurret.setAvailable(false); // As per your Store.js


            // Orbs
            GameItem attackOrb = new GameItem();
            attackOrb.setItemId("attack_orb");
            attackOrb.setName("Attack Orb");
            attackOrb.setCategory("orbs");
            attackOrb.setDescription("Attacks nearby enemies");
            attackOrb.setPrice(700);
            attackOrb.setAvailable(true);
            // Add other orbs... defense_orb, healing_orb, support_orb set available=false if needed

            // Skills
            GameItem recovery = new GameItem();
            recovery.setItemId("recovery");
            recovery.setName("Recovery");
            recovery.setCategory("skills");
            recovery.setDescription("Slowly regenerate health over time");
            recovery.setPrice(400);
            recovery.setAvailable(true);

            GameItem lifeSteal = new GameItem();
            lifeSteal.setItemId("lifeSteal");
            lifeSteal.setName("Life Steal");
            lifeSteal.setCategory("skills");
            lifeSteal.setDescription("Heal when dealing damage to enemies");
            lifeSteal.setPrice(600);
            lifeSteal.setAvailable(true);

            // Add other skills... thorns, momentum, fastReload

            // Ultimates
            GameItem dragonsBreath = new GameItem();
            dragonsBreath.setItemId("dragons_breath");
            dragonsBreath.setName("Dragons Breath");
            dragonsBreath.setCategory("ultimates");
            dragonsBreath.setDescription("Call in a dragon to clear a massive amount of enemies at once");
            dragonsBreath.setPrice(5000);
            dragonsBreath.setAvailable(false);


            List<GameItem> itemsToSave = Arrays.asList(
                    basicTurret, sniperTurret,
                    attackOrb, /* other orbs... */
                    recovery, lifeSteal, /* other skills... */
                    dragonsBreath
            );

            gameItemRepository.saveAll(itemsToSave);
            System.out.println("Game items initialized.");
        } else {
            System.out.println("Game items already exist.");
        }
    }
}