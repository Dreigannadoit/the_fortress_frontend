import { turret_shoot } from "../assets";
import { getScaledValue } from "../utils/getScaledValue";
import minutesToMilliseconds from "../utils/MinutesToMilliseconds";

// --- Constants --- 
export const ENEMY_SPAWN_COUNT = 2;
export const ENEMY_SPAWN_INTERVAL = 1500;
export const ENEMY_NORMAL_WEIGHT = 0.60;
export const ENEMY_FAST_WEIGHT = 0.35;
export const ENEMY_TANK_WEIGHT = 0.05;
export const BASE_DAMAGE_INTERVAL = 200; 
export const LINE_Y_OFFSET = getScaledValue(200);

export const INITIAL_BASE_HEALTH = 500;
export const INITIAL_PLAYER_HEALTH = 100;


export const HAS_RECOVERY = false;
export const HAS_LIFE_STEAL = false;
export const HAS_THORNS = false;
export const HAS_MOMENTUM = false;
export const HAS_FAST_RELAOD = false;

export const ITEM_SPAWN_INTERVAL = minutesToMilliseconds(0.2); 
export const ITEM_SPAWN_CHANCE = 0.3; 

export const TURRET_CONFIG = {
    fireSound: turret_shoot,
    size: 90,           // Base diameter,
    barrelLength: 60,   // Length of the barrel
    bulletSize: 6,     
    bulletSpeed: 40, 
    damage: 15,     
    fireRate: 1000,    
    range: getScaledValue(0),         // Targeting range
    color: '#555',      
    barrelColor: '#666', 
    highlightColor: '#888',
    shadowColor: '#333',
    muzzleColor: '#222'
};

export const weapons = {
    pistol: {
        name: 'pistol', // slingshot
        fireRate: 200,
        damage: 15,
        range: getScaledValue(1000), // Use vmin
        bulletSpeed: 12,        // px/frame
        bulletSize: getScaledValue(15), // Use vmin
        maxAmmo: 15,
        reloadDuration: 1500,
        isAutomatic: false,
        unlocked: true,
        recoilForce: 0.5,        // Keep abstract force value
    },
    shotgun: {
        name: 'shotgun', // wizard wand
        fireRate: 900,
        damage: 35,             // Per pellet
        pellets: 8,
        spread: (Math.PI * 4) / 12,   // Radians
        range: getScaledValue(305), // Use vmin
        bulletSpeed: 18,        // px/frame
        bulletSize: getScaledValue(12), // Use vmin
        maxAmmo: 8,
        reloadDuration: 2500,
        isAutomatic: false,
        unlocked: true,
        recoilForce: 15,
    },
    machinegun: {
        name: 'machinegun',  // rock incantation
        fireRate: 80,
        damage: 30,
        range: getScaledValue(500), // Use vmin
        bulletSpeed: 20,        // px/frame
        bulletSize: getScaledValue(10), // Use vmin
        maxAmmo: 100,
        reloadDuration: 3000,
        isAutomatic: true,
        unlocked: true,
        recoilForce: 3,
    }
};


export const ENEMY_TYPES = {
    normal: {
        size: getScaledValue(120),
        speed: 1.5,
        health: 100,
        damage: 10,
        score: 10,
        knockbackResistance: 0,
        behavior: 'ground',
        color: 'red'
    },
    fast: {
        size: getScaledValue(100),
        speed: 4,
        health: 50,
        damage: 2,
        score: 15,
        knockbackResistance: 0.2,
        behavior: 'chase',
        color: '#00ffff'
    },
    tank: {
        size: getScaledValue(200),
        speed: 0.55,
        health: 500,
        damage: 25,
        score: 20,
        knockbackResistance: 0.8,
        behavior: 'ground',
        color: '#006400'
    }
};