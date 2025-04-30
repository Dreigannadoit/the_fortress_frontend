package com.utr.gameapi.repository;

import com.utr.gameapi.entity.GameItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GameItemRepository extends JpaRepository<GameItem, Long> {
    Optional<GameItem> findByItemId(String itemId);
    List<GameItem> findByCategoryAndAvailable(String category, boolean available);
    List<GameItem> findByAvailable(boolean available);
}