package com.utr.gameapi.service;

import com.utr.gameapi.dto.JwtResponse;
import com.utr.gameapi.dto.LoginRequest;
import com.utr.gameapi.dto.RegisterRequest;
import com.utr.gameapi.entity.PlayerStats;
import com.utr.gameapi.entity.User;
import com.utr.gameapi.entity.UserWeaponOwnership;
import com.utr.gameapi.entity.Weapon;
import com.utr.gameapi.repository.UserRepository;
import com.utr.gameapi.repository.WeaponRepository;
import com.utr.gameapi.security.jwt.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    WeaponRepository weaponRepository; // Needed to give default weapon

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Transactional // Make registration atomic
    public void registerUser(RegisterRequest registerRequest) {
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new IllegalArgumentException("Error: Username is already taken!");
        }

        // Create new user's account
        User user = new User(registerRequest.getUsername(),
                encoder.encode(registerRequest.getPassword()));

        // Create initial player stats
        PlayerStats stats = new PlayerStats(user);
        stats.setCurrentWeaponName("pistol"); // Ensure default weapon is set
        user.setPlayerStats(stats); // Establish bidirectional link

        // Find the default pistol weapon definition
        Weapon defaultWeapon = weaponRepository.findByName("pistol")
                .orElseThrow(() -> new RuntimeException("Error: Default weapon 'pistol' not found in database!"));

        // Grant ownership of the default weapon
        user.addOwnedWeapon(new UserWeaponOwnership(user, defaultWeapon));

        userRepository.save(user); // Saving user cascades to PlayerStats and UserWeaponOwnership
    }

    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername()).orElseThrow(
                () -> new RuntimeException("User not found after authentication") // Should not happen
        );

        return new JwtResponse(jwt, "Bearer", user.getId(), userDetails.getUsername());
    }
}