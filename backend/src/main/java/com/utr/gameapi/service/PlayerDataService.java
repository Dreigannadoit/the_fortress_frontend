package com.utr.gameapi.service;

import com.utr.gameapi.dto.PlayerDataResponse;
import com.utr.gameapi.dto.PurchaseRequest;
import com.utr.gameapi.dto.UpdatePlayerStatsRequest;
import com.utr.gameapi.entity.*;
import com.utr.gameapi.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PlayerDataService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PlayerStatsRepository playerStatsRepository;
    @Autowired
    private WeaponRepository weaponRepository;
    @Autowired
    private GameItemRepository gameItemRepository;
    @Autowired
    private UserWeaponOwnershipRepository userWeaponOwnershipRepository;
    @Autowired
    private UserItemOwnershipRepository userItemOwnershipRepository;

    @Transactional(readOnly = true) // Good for read operations
    public PlayerDataResponse getPlayerData(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        PlayerStats stats = user.getPlayerStats(); // Fetch via user relationship

        // Fetch owned weapon names efficiently
        Set<String> ownedWeaponNames = user.getOwnedWeapons().stream()
                .map(ownership -> ownership.getWeapon().getName())
                .collect(Collectors.toSet());

        // Fetch owned item IDs efficiently and group by category
        Map<String, Set<String>> ownedItemsByCategory = user.getOwnedItems().stream()
                .collect(Collectors.groupingBy(
                        ownership -> ownership.getGameItem().getCategory(), // Group by category
                        Collectors.mapping(ownership -> ownership.getGameItem().getItemId(), Collectors.toSet()) // Collect item IDs in a Set
                ));


        PlayerDataResponse response = new PlayerDataResponse();
        response.setCurrency(stats.getCurrency());
        response.setLevel(stats.getLevel());
        response.setKills(stats.getKills());
        response.setCurrentWeaponName(stats.getCurrentWeaponName());
        response.setOwnedWeaponNames(ownedWeaponNames);
        response.setOwnedItemsByCategory(ownedItemsByCategory);
        response.setActiveSkillIds(stats.getActiveSkillIds());

        return response;
    }

    @Transactional
    public PlayerDataResponse updatePlayerStats(String username, UpdatePlayerStatsRequest request) {
        PlayerStats stats = playerStatsRepository.findByUser_Username(username)
                .orElseThrow(() -> new UsernameNotFoundException("Player stats not found for user: " + username));

        stats.setCurrency(request.getCurrency());
        stats.setLevel(request.getLevel());
        stats.setKills(request.getKills());

        if (request.getCurrentWeaponName() != null) {
            // Optional: Validate if user owns the weapon before setting
            if(userWeaponOwnershipRepository.existsByUser_UsernameAndWeapon_Name(username, request.getCurrentWeaponName())) {
                stats.setCurrentWeaponName(request.getCurrentWeaponName());
            } else {
                // Handle error: User doesn't own the weapon they're trying to equip
                System.err.println("User " + username + " tried to equip unowned weapon: " + request.getCurrentWeaponName());
            }
        }
        if (request.getActiveSkillIds() != null) {
            // Optional: Validate if user owns all skills before setting active
            Set<String> ownedItemIds = userItemOwnershipRepository.findOwnedItemIdsByUsername(username);
            boolean allActiveOwned = request.getActiveSkillIds().stream().allMatch(ownedItemIds::contains);
            if(allActiveOwned) {
                stats.setActiveSkillIds(request.getActiveSkillIds());
            } else {
                // Handle error: User tried to activate unowned skill/item
                System.err.println("User " + username + " tried to activate unowned skills/items.");
            }
        }

        playerStatsRepository.save(stats);
        return getPlayerData(username); // Return updated data
    }

    @Transactional
    public PlayerDataResponse purchaseItem(String username, PurchaseRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        PlayerStats stats = user.getPlayerStats();

        int price;
        boolean alreadyOwned;

        if ("weapons".equalsIgnoreCase(request.getCategory())) {
            Weapon weapon = weaponRepository.findByName(request.getItemId())
                    .orElseThrow(() -> new IllegalArgumentException("Weapon not found: " + request.getItemId()));
            price = weapon.getPrice();
            alreadyOwned = userWeaponOwnershipRepository.existsByUserAndWeapon(user, weapon);

            if (alreadyOwned) {
                throw new IllegalArgumentException("Item already owned: " + request.getItemId());
            }
            if (stats.getCurrency() < price) {
                throw new IllegalArgumentException("Not enough currency.");
            }

            stats.setCurrency(stats.getCurrency() - price);
            UserWeaponOwnership ownership = new UserWeaponOwnership(user, weapon);
            user.addOwnedWeapon(ownership); // Add to user's collection
            // userWeaponOwnershipRepository.save(ownership); // Saving user should cascade

        } else { // Handle GameItems (Turrets, Drones, Skills, etc.)
            GameItem item = gameItemRepository.findByItemId(request.getItemId())
                    .orElseThrow(() -> new IllegalArgumentException("Item not found: " + request.getItemId()));

            if (!item.getCategory().equalsIgnoreCase(request.getCategory())) {
                throw new IllegalArgumentException("Item category mismatch for: " + request.getItemId());
            }
            if (!item.isAvailable()) {
                throw new IllegalArgumentException("Item not available for purchase: " + request.getItemId());
            }

            price = item.getPrice();
            alreadyOwned = userItemOwnershipRepository.existsByUser_UsernameAndGameItem_ItemId(username, item.getItemId());

            if (alreadyOwned) {
                throw new IllegalArgumentException("Item already owned: " + request.getItemId());
            }
            if (stats.getCurrency() < price) {
                throw new IllegalArgumentException("Not enough currency.");
            }

            stats.setCurrency(stats.getCurrency() - price);
            UserItemOwnership ownership = new UserItemOwnership(user, item);
            user.addOwnedItem(ownership); // Add to user's collection
            // userItemOwnershipRepository.save(ownership); // Saving user should cascade
        }

        userRepository.save(user); // Save user to persist stats changes and new ownerships
        return getPlayerData(username); // Return updated player data
    }

    @Transactional
    public PlayerDataResponse setCurrentWeapon(String username, String weaponName) {
        PlayerStats stats = playerStatsRepository.findByUser_Username(username)
                .orElseThrow(() -> new UsernameNotFoundException("Player stats not found for user: " + username));

        // Validate ownership
        if (!userWeaponOwnershipRepository.existsByUser_UsernameAndWeapon_Name(username, weaponName)) {
            throw new IllegalArgumentException("User does not own weapon: " + weaponName);
        }

        stats.setCurrentWeaponName(weaponName);
        playerStatsRepository.save(stats);
        return getPlayerData(username);
    }

    @Transactional
    public PlayerDataResponse setActiveSkills(String username, List<String> activeSkillIds) {
        PlayerStats stats = playerStatsRepository.findByUser_Username(username)
                .orElseThrow(() -> new UsernameNotFoundException("Player stats not found for user: " + username));

        // Validate ownership of all skills being activated
        Set<String> ownedItemIds = userItemOwnershipRepository.findOwnedItemIdsByUsername(username);
        boolean allActiveOwned = activeSkillIds.stream().allMatch(ownedItemIds::contains);

        if (!allActiveOwned) {
            throw new IllegalArgumentException("Attempted to activate unowned skills/items.");
        }

        stats.setActiveSkillIds(activeSkillIds);
        playerStatsRepository.save(stats);
        return getPlayerData(username);
    }
}