package com.utr.gameapi.service;

import com.utr.gameapi.dto.StoreItemResponse;
import com.utr.gameapi.entity.GameItem;
import com.utr.gameapi.entity.Weapon;
import com.utr.gameapi.repository.GameItemRepository;
import com.utr.gameapi.repository.WeaponRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class StoreService {

    @Autowired
    private WeaponRepository weaponRepository;

    @Autowired
    private GameItemRepository gameItemRepository;

    @Transactional(readOnly = true)
    public List<StoreItemResponse> getAvailableStoreItems() {
        // Fetch available weapons
        List<Weapon> weapons = weaponRepository.findByUnlockable(true); // Assuming unlockable means potentially available
        List<StoreItemResponse> weaponItems = weapons.stream()
                .map(this::mapWeaponToStoreItem)
                .collect(Collectors.toList());

        // Fetch available game items (turrets, skills, etc.)
        List<GameItem> gameItems = gameItemRepository.findByAvailable(true);
        List<StoreItemResponse> otherItems = gameItems.stream()
                .map(this::mapGameItemToStoreItem)
                .collect(Collectors.toList());

        // Combine lists
        return Stream.concat(weaponItems.stream(), otherItems.stream())
                .collect(Collectors.toList());
    }

    // Helper mapping functions
    private StoreItemResponse mapWeaponToStoreItem(Weapon weapon) {
        StoreItemResponse dto = new StoreItemResponse();
        dto.setId(weapon.getName()); // Use name as the unique ID for weapons in store
        dto.setName(weapon.getName()); // Or use a separate display name field if you add one
        dto.setPrice(weapon.getPrice());
        dto.setDescription(weapon.getDescription());
        dto.setCategory("weapons");
        dto.setAvailable(weapon.isUnlockable()); // Base availability on unlockable status
        return dto;
    }

    private StoreItemResponse mapGameItemToStoreItem(GameItem item) {
        StoreItemResponse dto = new StoreItemResponse();
        dto.setId(item.getItemId());
        dto.setName(item.getName());
        dto.setPrice(item.getPrice());
        dto.setDescription(item.getDescription());
        dto.setCategory(item.getCategory());
        dto.setAvailable(item.isAvailable());
        return dto;
    }
}