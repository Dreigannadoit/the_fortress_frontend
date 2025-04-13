import { getScaledValue } from "../utils/getScaledValue";
// --- Constants --- 
export const ENEMY_SPAWN_COUNT = 7;
export const ENEMY_SPAWN_INTERVAL = 1000;
export const ENEMY_NORMAL_WEIGHT = 0.60;
export const ENEMY_FAST_WEIGHT = 0.30;
export const ENEMY_TANK_WEIGHT = 0.10;
export const BASE_DAMAGE_INTERVAL = 15000;
export const LINE_Y_OFFSET = 120;
export const INITIAL_BASE_HEALTH = 2000;
export const HAS_RECOVERY = false;
export const HAS_LIFE_STEAL = false;
export const HAS_THORNS = false;
export const HAS_MOMENTUM = false;

export const TURRET_CONFIG = {
    fireRate: 100, // ms between shots
    range: 530,     // pixels
    damage: 575,
    bulletSpeed: 15,
    size: 70,       // Turret base size
    color: "#4A4A4A",
    barrelColor: "#2C2C2C",
    barrelLength: 25,
    bulletSize: 10,
};

export const weapons = {
    pistol: {
        name: 'pistol',
        fireRate: 200,
        damage: 50,
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
        fireRate: 700,
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
        size: 20,
        speed: 0.3,
        health: 50,
        damage: 10,
        score: 10,
        knockbackResistance: 0,
        behavior: 'ground',
        color: 'red'
    },
    fast: {
        size: 10,
        speed: 2.5,
        health: 25,
        damage: 2,
        score: 15,
        knockbackResistance: 0.2,
        behavior: 'chase',
        color: '#00ffff'
    },
    tank: {
        size: 50,
        speed: 0.15,
        health: 300,
        damage: 25,
        score: 20,
        knockbackResistance: 0.8,
        behavior: 'ground',
        color: '#006400'
    }
};