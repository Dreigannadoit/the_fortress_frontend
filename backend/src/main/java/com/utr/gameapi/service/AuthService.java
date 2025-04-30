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
import com.utr.gameapi.security.services.UserDetailsImpl;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

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

    @Transactional
    public void registerUser(RegisterRequest registerRequest) {
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new IllegalArgumentException("Error: Username is already taken!");
        }

        User user = new User(
                registerRequest.getUsername(),
                encoder.encode(registerRequest.getPassword())
        );

        // Initialize player stats
        PlayerStats stats = new PlayerStats(user);
        stats.setCurrentWeaponName("pistol");
        user.setPlayerStats(stats);

        // Grant default weapon
        Weapon defaultWeapon = weaponRepository.findByName("pistol")
                .orElseThrow(() -> new RuntimeException("Default weapon 'pistol' not found"));
        user.addOwnedWeapon(new UserWeaponOwnership(user, defaultWeapon));

        userRepository.save(user);
    }

    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        return new JwtResponse(
                jwt,
                userDetails.getId(),
                userDetails.getUsername()
        );
    }
}