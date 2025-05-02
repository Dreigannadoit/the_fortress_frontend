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
        // Fetch weapons marked as unlockable (usually means they can appear in store/game)
        List<Weapon> weapons = weaponRepository.findByUnlockable(true);
        List<StoreItemResponse> weaponItems = weapons.stream()
                .map(this::mapWeaponToStoreItem)
                .collect(Collectors.toList());

        // Fetch ALL game items (skills, orbs, etc.)
        // Let the 'available' flag handle display logic in the frontend
        List<GameItem> gameItems = gameItemRepository.findAll(); // <--- CHANGE THIS LINE
        List<StoreItemResponse> otherItems = gameItems.stream()
                .map(this::mapGameItemToStoreItem)
                .collect(Collectors.toList());

        // Combine lists
        return Stream.concat(weaponItems.stream(), otherItems.stream())
                .collect(Collectors.toList());
    }

    // Helper mapping functions (remain the same)
    private StoreItemResponse mapWeaponToStoreItem(Weapon weapon) {
        StoreItemResponse dto = new StoreItemResponse();
        dto.setId(weapon.getName());
        dto.setName(weapon.getName());
        dto.setPrice(weapon.getPrice());
        dto.setDescription(weapon.getDescription());
        dto.setCategory("weapons");
        // 'available' for weapons could still depend on unlockable, or add a specific 'storeAvailable' field
        dto.setAvailable(weapon.isUnlockable());
        return dto;
    }

    private StoreItemResponse mapGameItemToStoreItem(GameItem item) {
        StoreItemResponse dto = new StoreItemResponse();
        dto.setId(item.getItemId());
        dto.setName(item.getName());
        dto.setPrice(item.getPrice());
        dto.setDescription(item.getDescription());
        dto.setCategory(item.getCategory());
        dto.setAvailable(item.isAvailable()); // Use the flag directly from the DB item
        return dto;
    }
}