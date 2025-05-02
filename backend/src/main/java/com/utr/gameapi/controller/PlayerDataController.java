package com.utr.gameapi.controller;

import com.utr.gameapi.dto.ActiveSkillsRequest;
import com.utr.gameapi.dto.PlayerDataResponse;
import com.utr.gameapi.dto.PurchaseRequest;
import com.utr.gameapi.dto.UpdatePlayerStatsRequest;
import com.utr.gameapi.service.PlayerDataService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/player")
// Ensure user is logged in for all methods here
@PreAuthorize("isAuthenticated()")
public class PlayerDataController {

    @Autowired
    private PlayerDataService playerDataService;

    private String getCurrentUsername(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return userDetails.getUsername();
    }

    @GetMapping("/data") // Changed from /stats to be more descriptive
    public ResponseEntity<PlayerDataResponse> getPlayerData(Authentication authentication) {
        String username = getCurrentUsername(authentication);
        PlayerDataResponse data = playerDataService.getPlayerData(username);
        return ResponseEntity.ok(data);
    }

    @PutMapping("/data") // Changed from /stats
    public ResponseEntity<?> updatePlayerData(Authentication authentication, @Valid @RequestBody UpdatePlayerStatsRequest request) {
        String username = getCurrentUsername(authentication);
        try {
            PlayerDataResponse updatedData = playerDataService.updatePlayerStats(username, request);
            return ResponseEntity.ok(updatedData);
        } catch (Exception e) {
            // Log error e
            return ResponseEntity.badRequest().body("Error updating player data: " + e.getMessage());
        }
    }

    @PostMapping("/purchase")
    public ResponseEntity<?> purchaseItem(Authentication authentication, @Valid @RequestBody PurchaseRequest request) {
        String username = getCurrentUsername(authentication);
        try {
            PlayerDataResponse updatedData = playerDataService.purchaseItem(username, request);
            return ResponseEntity.ok(updatedData);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            // Log error e
            return ResponseEntity.internalServerError().body("Error processing purchase: " + e.getMessage());
        }
    }

    @PutMapping("/weapon/{weaponName}")
    public ResponseEntity<?> setCurrentWeapon(Authentication authentication, @PathVariable String weaponName) {
        String username = getCurrentUsername(authentication);
        try {
            PlayerDataResponse updatedData = playerDataService.setCurrentWeapon(username, weaponName);
            return ResponseEntity.ok(updatedData);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            // Log error e
            return ResponseEntity.internalServerError().body("Error setting weapon: " + e.getMessage());
        }
    }

    @PutMapping("/skills/active")
    public ResponseEntity<?> setActiveSkills(Authentication authentication, @Valid @RequestBody ActiveSkillsRequest request) {
        String username = getCurrentUsername(authentication);
        try {
            PlayerDataResponse updatedData = playerDataService.setActiveSkills(username, request.getActiveSkillIds());
            return ResponseEntity.ok(updatedData);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            // Log error e
            return ResponseEntity.internalServerError().body("Error setting active skills: " + e.getMessage());
        }
    }

    @DeleteMapping("/account") // Define the DELETE endpoint
    public ResponseEntity<?> deleteUserAccount(Authentication authentication) {
        String username = getCurrentUsername(authentication);
        try {
            playerDataService.deleteAccount(username);
            // Return 200 OK with a message or 204 No Content
            return ResponseEntity.ok("Account deleted successfully.");
            // return ResponseEntity.noContent().build(); // Alternative for 204 status
        } catch (UsernameNotFoundException e) {
            // This shouldn't ideally happen if PreAuthorize works, but good practice
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            // Log error e
            System.err.println("Error deleting account for " + username + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting account. Please try again later.");
        }
    }
}