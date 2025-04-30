package com.utr.gameapi.controller;

import com.utr.gameapi.dto.StoreItemResponse;
import com.utr.gameapi.service.StoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/store")
// No PreAuthorize needed if store items are public
public class StoreController {

    @Autowired
    private StoreService storeService;

    @GetMapping("/items")
    public ResponseEntity<List<StoreItemResponse>> getStoreItems() {
        List<StoreItemResponse> items = storeService.getAvailableStoreItems();
        return ResponseEntity.ok(items);
    }

    // Optional: Add endpoints to get specific item types if needed
    // e.g., GET /api/store/weapons, GET /api/store/turrets etc.
    // These would call specific methods in StoreService or dedicated services.
}