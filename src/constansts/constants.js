import useMinutesToMilliseconds from "../hooks/useMinutesToMilliseconds";
import { getScaledValue } from "../utils/getScaledValue";
// --- Constants --- 
export const ENEMY_SPAWN_COUNT = 2;
export const ENEMY_SPAWN_INTERVAL = useMinutesToMilliseconds(1);
export const ENEMY_NORMAL_WEIGHT = 0.60;
export const ENEMY_FAST_WEIGHT = 0.35;
export const ENEMY_TANK_WEIGHT = 0.05;
export const BASE_DAMAGE_INTERVAL = useMinutesToMilliseconds(1); // 1 minute
export const LINE_Y_OFFSET = 120;
export const INITIAL_BASE_HEALTH = 2000;
export const HAS_RECOVERY = false;
export const HAS_LIFE_STEAL = false;
export const HAS_THORNS = false;
export const HAS_MOMENTUM = false;


export const ITEM_SPAWN_INTERVAL = 10000; // 10 seconds
export const ITEM_SPAWN_CHANCE = 0.3; // 30% chance per interval

export const TURRET_CONFIG = {
    size: 90,           // Base diameter
    barrelLength: 60,   // Length of the barrel
    bulletSize: 6,      // Size of bullets
    bulletSpeed: 10,    // Speed of bullets
    damage: 15,         // Damage per hit
    fireRate: 1000,     // Milliseconds between shots
    range: 300,         // Targeting range
    color: '#555',      // Base color
    barrelColor: '#666', // Barrel color
    // Add these new properties:
    highlightColor: '#888',
    shadowColor: '#333',
    muzzleColor: '#222'
};

export const weapons = {
    pistol: {
        name: 'pistol',
        fireRate: 200,
        damage: 15,
        range: getScaledValue(600), // Use vmin
        bulletSpeed: 12,        // px/frame
        bulletSize: getScaledValue(8), // Use vmin
        maxAmmo: 15,
        reloadDuration: 1500,
        isAutomatic: false,
        unlocked: true,
        recoilForce: 0.5,        // Keep abstract force value
    },
    shotgun: {
        name: 'shotgun',
        fireRate: 900,
        damage: 35,             // Per pellet
        pellets: 8,
        spread: Math.PI / 12,   // Radians
        range: getScaledValue(305), // Use vmin
        bulletSpeed: 18,        // px/frame
        bulletSize: getScaledValue(6), // Use vmin
        maxAmmo: 8,
        reloadDuration: 2500,
        isAutomatic: false,
        unlocked: true,
        recoilForce: 15,
    },
    machinegun: {
        name: 'machinegun',
        fireRate: 80,
        damage: 30,
        range: getScaledValue(500), // Use vmin
        bulletSpeed: 20,        // px/frame
        bulletSize: getScaledValue(7), // Use vmin
        maxAmmo: 40,
        reloadDuration: 3000,
        isAutomatic: true,
        unlocked: true,
        recoilForce: 3,
    }
};


export const ENEMY_TYPES = {
    normal: {
        size: getScaledValue(200),
        speed: 1,
        health: 100,
        damage: 10,
        score: 10,
        knockbackResistance: 0,
        behavior: 'ground',
        color: 'red'
    },
    fast: {
        size: getScaledValue(100),
        speed: 3.5,
        health: 50,
        damage: 2,
        score: 15,
        knockbackResistance: 0.2,
        behavior: 'chase',
        color: '#00ffff'
    },
    tank: {
        size: getScaledValue(350),
        speed: 0.15,
        health: 500,
        damage: 25,
        score: 20,
        knockbackResistance: 0.8,
        behavior: 'ground',
        color: '#006400'
    }
};