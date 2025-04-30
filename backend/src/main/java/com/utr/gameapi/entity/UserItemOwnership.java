package com.utr.gameapi.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_item_ownership",
        uniqueConstraints = { @UniqueConstraint(columnNames = {"user_id", "item_id"}) })
@Getter
@Setter
@NoArgsConstructor
public class UserItemOwnership {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false) // Refers to GameItem's ID (Long)
    private GameItem gameItem;

    // Store the item's string ID for easier lookup if needed, though gameItem relationship is primary
    @Column(name = "item_string_id", nullable = false)
    private String itemStringId;

    public UserItemOwnership(User user, GameItem gameItem) {
        this.user = user;
        this.gameItem = gameItem;
        this.itemStringId = gameItem.getItemId();
    }
}