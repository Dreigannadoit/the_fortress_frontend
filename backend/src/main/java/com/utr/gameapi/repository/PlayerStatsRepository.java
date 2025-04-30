package com.utr.gameapi.repository;

import com.utr.gameapi.entity.PlayerStats;
import com.utr.gameapi.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlayerStatsRepository extends JpaRepository<PlayerStats, Long> {
    Optional<PlayerStats> findByUser(User user);
    Optional<PlayerStats> findByUser_Username(String username); // Find stats by username
}