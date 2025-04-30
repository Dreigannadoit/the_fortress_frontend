package com.utr.gameapi.repository;

import com.utr.gameapi.entity.GameItem;
import com.utr.gameapi.entity.User;
import com.utr.gameapi.entity.UserItemOwnership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface UserItemOwnershipRepository extends JpaRepository<UserItemOwnership, Long> {
    List<UserItemOwnership> findByUser(User user);
    Optional<UserItemOwnership> findByUserAndGameItem(User user, GameItem gameItem);
    Optional<UserItemOwnership> findByUser_UsernameAndGameItem_ItemId(String username, String itemId);

    @Query("SELECT o.itemStringId FROM UserItemOwnership o WHERE o.user = :user")
    Set<String> findOwnedItemIdsByUser(User user); // Efficiently get just the IDs

    @Query("SELECT o.itemStringId FROM UserItemOwnership o WHERE o.user.username = :username")
    Set<String> findOwnedItemIdsByUsername(String username);

    boolean existsByUser_UsernameAndGameItem_ItemId(String username, String itemId);
}