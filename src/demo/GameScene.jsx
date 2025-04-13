// import React, { useRef, useEffect, useState, useCallback } from 'react';
// import { Enemy } from '../../entities/enemy';
// import { weapons } from '../constansts/constants';
// import { playerSprite } from '../assets';
// import Player from '../entities/Player';
// import { PassiveSkills } from '../systems/PassiveSkills';
// import Drone from '../entities/Drone';

// // --- Constants --- 
// const ENEMY_SPAWN_COUNT = 7;
// const ENEMY_SPAWN_INTERVAL = 1000;
// const ENEMY_NORMAL_WEIGHT = 0.60;
// const ENEMY_FAST_WEIGHT = 0.30;
// const ENEMY_TANK_WEIGHT = 0.10;
// const BASE_DAMAGE_INTERVAL = 15000;
// const LINE_Y_OFFSET = 120;
// const INITIAL_BASE_HEALTH = 2000;
// const HAS_RECOVERY = false;
// const HAS_LIFE_STEAL = false;
// const HAS_THORNS = false;
// const HAS_MOMENTUM = false;

// const TURRET_CONFIG = {
//     fireRate: 100, // ms between shots
//     range: 530,     // pixels
//     damage: 575,
//     bulletSpeed: 15,
//     size: 70,       // Turret base size
//     color: "#4A4A4A",
//     barrelColor: "#2C2C2C",
//     barrelLength: 25,
//     bulletSize: 10,
// };

// // --- Helper Functions --- (Keep these)

// const calculateDistance = (x1, y1, x2, y2) => {
//     const dx = x2 - x1;
//     const dy = y2 - y1;
//     return Math.sqrt(dx * dx + dy * dy);
// };

// const getRandomEnemyType = () => {
//     const spawnRates = {
//         normal: ENEMY_NORMAL_WEIGHT,
//         fast: ENEMY_FAST_WEIGHT,
//         tank: ENEMY_TANK_WEIGHT,
//     };
//     const random = Math.random();
//     let cumulative = 0;
//     for (const type in spawnRates) {
//         cumulative += spawnRates[type];
//         if (random < cumulative) {
//             return type;
//         }
//     }
//     return 'normal';
// };

// const useCanvas = () => {
//     const canvasRef = useRef(null);
//     useEffect(() => {
//         const canvas = canvasRef.current;
//         if (!canvas) return;
//         const ctx = canvas.getContext('2d');
//         const resizeCanvas = () => {
//             canvas.width = window.innerWidth;
//             canvas.height = window.innerHeight;
//         };
//         resizeCanvas();
//         window.addEventListener('resize', resizeCanvas);
//         return () => {
//             window.removeEventListener('resize', resizeCanvas);
//         };
//     }, []);
//     return canvasRef;
// };

// const useImage = (imageSrc) => {
//     const imageRef = useRef(null);
//     useEffect(() => {
//         const img = new Image();
//         img.src = imageSrc;
//         img.onload = () => {
//             imageRef.current = img;
//         };
//     }, [imageSrc]);
//     return imageRef;
// };

// const GameScene = () => {
//     const canvasRef = useCanvas();
//     const playerImageRef = useImage(playerSprite);

//     // --- State Variables for UI ---
//     const [win, setWin] = useState(false); // Initialize to false
//     const [gameOver, setGameOver] = useState(false); // Initialize to false// Add to your state variables
//     const [isPaused, setIsPaused] = useState(false);
//     const [currentWeaponInfo, setCurrentWeaponInfo] = useState(weapons.pistol); // Store weapon details for UI
//     const [currentAmmo, setCurrentAmmo] = useState(weapons.pistol.maxAmmo);
//     const [isReloading, setIsReloading] = useState(false);
//     const [reloadTime, setReloadTime] = useState(0); // Use for UI display (cooldown/reload progress)
//     const [playerHealth, setPlayerHealth] = useState(100); // Still needed for UI and game over check
//     const [baseHealth, setBaseHealth] = useState(INITIAL_BASE_HEALTH);
//     const [score, setScore] = useState(0);
//     const [timeElapsed, setTimeElapsed] = useState(0);
//     const gameDuration = 120000;
//     const [passiveSkills, setPassiveSkills] = useState({
//         recovery: false,
//         lifeSteal: false,
//         thorns: false,
//         momentum: false,
//         fastReload: false // Add new skill
//     });
//     const [enemyScalingFactor, setEnemyScalingFactor] = useState(1); 

//     const [maxDrones, setMaxDrones] = useState(4); // Start with 4 drone
//     const drones = useRef([]);

//     // --- Ref Variables ---
//     // Use useRef to hold the Player instance - persists across renders
//     const playerRef = useRef(null);
//     // Initialize playerRef only once
//     if (playerRef.current === null) {
//         playerRef.current = new Player(window.innerWidth / 2, window.innerHeight / 2);
//         // Initialize UI state based on the new player instance
//         setPlayerHealth(playerRef.current.getHealth());
//         setCurrentWeaponInfo(playerRef.current.getCurrentWeaponInfo());
//         setCurrentAmmo(playerRef.current.getCurrentAmmo());
//         setIsReloading(playerRef.current.isReloading());
//         setReloadTime(playerRef.current.getReloadTimeRemaining());
//     }

//     const healingEffects = useRef([]);
//     const passiveSkillsRef = useRef(passiveSkills);

//     const turrets = useRef([
//         { x: 50, y: null, angle: 0, targetEnemy: null, lastFireTime: 0 },
//         { x: null, y: null, angle: 0, targetEnemy: null, lastFireTime: 0 }
//     ]);

//     const bullets = useRef([]);
//     const enemies = useRef([]);
//     const mousePos = useRef({ x: 0, y: 0 });
//     const keys = useRef({ w: false, a: false, s: false, d: false, spacebar: false });
//     const mouseDown = useRef(false);

//     // Toggle skill activation
//     const toggleSkill = (skill) => {
//         setPassiveSkills(prev => ({
//             ...prev,
//             [skill]: !prev[skill]
//         }));
//     };

//     // --- Bullet Creation (Stays in GameScene - needs access to bullets.current) ---
//     const createBullet = useCallback((x, y, size, bulletSpeed, angle, range, damage, weaponType) => ({
//         x, y, size,
//         velocity: { x: Math.cos(angle) * bulletSpeed, y: Math.sin(angle) * bulletSpeed },
//         startX: x, startY: y, maxDistance: range, damage, angle, weaponType,
//     }), []);

//     const createBulletsCallbackForPlayer = useCallback((p, weapon, mousePosition) => {
//         const playerPos = p.getPosition(); // Get position from player instance
//         const angle = Math.atan2(mousePosition.y - playerPos.y, mousePosition.x - playerPos.x);
//         const gunOffset = 15; // Offset from player center
//         const bulletStartX = playerPos.x + Math.cos(angle + Math.PI / 2) * gunOffset;
//         const bulletStartY = playerPos.y + Math.sin(angle + Math.PI / 2) * gunOffset;

//         if (weapon.name === 'shotgun') {
//             const spread = weapon.spread;
//             const pelletAngles = Array.from({ length: weapon.pellets }, (_, i) =>
//                 angle - spread / 2 + (i * spread) / (weapon.pellets - 1)
//             );
//             pelletAngles.forEach(pelletAngle => {
//                 bullets.current.push(createBullet(
//                     bulletStartX, bulletStartY, weapon.bulletSize, weapon.bulletSpeed,
//                     pelletAngle, weapon.range, weapon.damage, weapon.name
//                 ));
//             });
//         } else {
//             bullets.current.push(createBullet(
//                 bulletStartX, bulletStartY, weapon.bulletSize, weapon.bulletSpeed,
//                 angle, weapon.range, weapon.damage, weapon.name
//             ));
//         }
//     }, [createBullet]);

//     // --- Game Logic Handlers ---
//     const handleMouseMove = useCallback((e) => {
//         mousePos.current = { x: e.clientX, y: e.clientY };
//     }, []);

//     // Simplified - logic moved to Player.attemptFire
//     const handleWeaponFire = useCallback(() => {
//         const player = playerRef.current;
//         if (!player) return;

//         player.attemptFire(mousePos.current, createBulletsCallbackForPlayer);
//         // Update UI state after firing attempt (ammo might change, reload might start)
//         setCurrentAmmo(player.getCurrentAmmo());
//         setIsReloading(player.isReloading());
//         setReloadTime(player.getReloadTimeRemaining());

//     }, [createBulletsCallbackForPlayer]); // Dependency


//     const handleMouseDown = useCallback((e) => {
//         mouseDown.current = true;
//         const player = playerRef.current;
//         if (player && !player.getCurrentWeaponInfo().isAutomatic) {
//             handleWeaponFire(); // Fire non-automatic on click
//         }
//     }, [handleWeaponFire]); // Dependency

//     const handleMouseUp = useCallback(() => {
//         mouseDown.current = false;
//     }, []);

//     const handleWeaponSwitch = useCallback((weaponName) => {
//         const player = playerRef.current;
//         if (!player) return;

//         player.switchWeapon(weaponName);

//         // Update UI state after switching
//         const newWeaponInfo = player.getCurrentWeaponInfo();
//         setCurrentWeaponInfo(newWeaponInfo); // Update weapon display info
//         setCurrentAmmo(player.getCurrentAmmo());
//         setIsReloading(player.isReloading());
//         setReloadTime(player.getReloadTimeRemaining());

//     }, []); // No external dependencies needed here

//     // handleKeyDown and handleKeyUp remain largely the same
//     const handleKeyDown = useCallback((e) => {
//         const key = e.key.toLowerCase();
//         if (keys.current.hasOwnProperty(key)) keys.current[key] = true;

//         switch (key) {
//             case '1': handleWeaponSwitch('pistol'); break;
//             case '2': handleWeaponSwitch('shotgun'); break;
//             case '3': handleWeaponSwitch('machinegun'); break;
//             case 'r': // Add manual reload key
//                 playerRef.current?.startReload();
//                 setIsReloading(playerRef.current?.isReloading() ?? false);
//                 setReloadTime(playerRef.current?.getReloadTimeRemaining() ?? 0);
//                 break;
//             default: break;
//         }
//     }, [handleWeaponSwitch]); // Dependency

//     const handleKeyUp = useCallback((e) => {
//         const key = e.key.toLowerCase();
//         if (keys.current.hasOwnProperty(key)) keys.current[key] = false;
//     }, []);

//     const updateDroneCount = (newCount) => {
//         setMaxDrones(Math.max(0, newCount));
//     };

//     const handleRestart = useCallback(() => {
//         // Reset all state variables
//         setWin(false);
//         setGameOver(false);
//         setBaseHealth(INITIAL_BASE_HEALTH);
//         setScore(0);
//         setTimeElapsed(0);

//         // Reset player state
//         if (playerRef.current) {
//             playerRef.current.reset(
//                 window.innerWidth / 2,
//                 window.innerHeight / 2
//             );
//             // Immediately update UI state
//             setPlayerHealth(playerRef.current.getHealth());
//             setCurrentWeaponInfo(playerRef.current.getCurrentWeaponInfo());
//             setCurrentAmmo(playerRef.current.getCurrentAmmo());
//             setIsReloading(false);
//             setReloadTime(0);
//         }

//         // Reset game objects
//         turrets.current = [
//             { x: 50, y: null, angle: 0, targetEnemy: null, lastFireTime: 0 },
//             { x: null, y: null, angle: 0, targetEnemy: null, lastFireTime: 0 }
//         ];
//         bullets.current = [];
//         enemies.current = [];

//         // Reset input states
//         keys.current = { w: false, a: false, s: false, d: false, spacebar: false };
//         mouseDown.current = false;
//         mousePos.current = { x: 0, y: 0 };

//         // Force restart game loop by adding a dummy state
//         setReloadTime(prev => prev + 1); // Triggers useEffect dependencies
//     }, [INITIAL_BASE_HEALTH]);

//     // TODO: Modify player damage handling
//     const handlePlayerDamage = (damage, attacker) => {
//         const player = playerRef.current;

//         if (player.canTakeDamage()) {
//             // Thorns before damage application
//             PassiveSkills.thorns(damage, attacker, passiveSkillsRef.current.thorns);

//             if (player.takeDamage(damage)) {
//                 setGameOver(true);
//             }
//         }

//         setPlayerHealth(player.getHealth());
//     };

//     useEffect(() => {
//         if (win || gameOver) return;
        
//         const scalingInterval = setInterval(() => {
//             setEnemyScalingFactor(prev => {
//                 const newFactor = prev * 1.2; // 20% increase
//                 console.log(`Enemy scaling increased to ${newFactor.toFixed(2)}x`);
//                 return newFactor;
//             });
//         }, 30000); // 30 seconds
        
//         return () => clearInterval(scalingInterval);
//     }, [win, gameOver]);

//     // Reload Modifier effect - Passive Skills
//     useEffect(() => {
//         passiveSkillsRef.current = passiveSkills;
//         const fastReloadActive = passiveSkills.fastReload;
//         const modifier = fastReloadActive ? 0.7 : 1.0;
//         if (playerRef.current) {
//             playerRef.current.setReloadModifier(modifier);
//         }
//     }, [passiveSkills]);

//     // visibility change detection
//     useEffect(() => {
//         const handleVisibilityChange = () => {
//             setIsPaused(document.hidden);
//             if (document.hidden) {
//                 // Release all keys when tab loses focus
//                 keys.current = { w: false, a: false, s: false, d: false, spacebar: false };
//             }
//         };

//         document.addEventListener('visibilitychange', handleVisibilityChange);
//         return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
//     }, []);

//     // Update passiveSkillsRef whenever passiveSkills changes
//     useEffect(() => {
//         passiveSkillsRef.current = passiveSkills;
//     }, [passiveSkills]);

//     // Game state effects remain the same
//     useEffect(() => {
//         if (timeElapsed >= gameDuration && !win && !gameOver) { // Prevent setting win if already game over
//             console.log("Win condition met");
//             setWin(true);
//         }
//     }, [timeElapsed, gameDuration, win, gameOver]);

//     useEffect(() => {
//         if ((playerHealth <= 0 || baseHealth <= 0) && !gameOver && !win) { // Prevent setting game over if already won
//             console.log("Game over condition met");
//             setGameOver(true);
//         }
//     }, [playerHealth, baseHealth, gameOver, win]);

//     // Timer interval remains the same
//     useEffect(() => {
//         if (win || gameOver) return;
//         const timerInterval = setInterval(() => {
//             setTimeElapsed(prev => prev + 1000);
//         }, 1000);
//         return () => clearInterval(timerInterval);
//     }, [win, gameOver]);

//     // --- Game Loop ---
//     useEffect(() => {
//         const canvas = canvasRef.current;
//         const ctx = canvas?.getContext('2d');
//         if (!ctx || !playerRef.current) return; // Ensure canvas and player exist

//         // --- Event Listeners --- (Setup remains the same)
//         window.addEventListener('mousemove', handleMouseMove);
//         window.addEventListener('mousedown', handleMouseDown);
//         window.addEventListener('mouseup', handleMouseUp);
//         window.addEventListener('keydown', handleKeyDown);
//         window.addEventListener('keyup', handleKeyUp);

//         // --- Enemy Spawning --- (Remains the same)
//         let enemySpawnIntervalId = null;

//         const spawnEnemy = () => {
//             if (isPaused || win || gameOver || !canvasRef.current) return;
        
//             for (let i = 0; i < ENEMY_SPAWN_COUNT; i++) {
//                 const type = getRandomEnemyType();
//                 const y = -10;
//                 const spawnZoneWidth = canvasRef.current.width * 0.1;
//                 const minX = spawnZoneWidth;
//                 const maxX = canvasRef.current.width - (spawnZoneWidth + 0.05 * canvasRef.current.width);
//                 const x = Math.random() * (maxX - minX) + minX;
//                 enemies.current.push(new Enemy(x, y, type, enemyScalingFactor));
//             }
//         };

//         // Start interval only if not win/gameOver
//         if (!win && !gameOver && !isPaused) {
//             enemySpawnIntervalId = setInterval(spawnEnemy, ENEMY_SPAWN_INTERVAL);
//         }

//         // --- Animation Loop ---
//         let animationFrameId;

//         const animate = () => {
//             const localCanvas = canvasRef.current; // Use local variable inside loop
//             const localCtx = localCanvas?.getContext('2d');
//             const localPlayer = playerRef.current; // Use local variable

//             if (isPaused) {
//                 animationFrameId = requestAnimationFrame(animate);
//                 return;
//             }

//             if (passiveSkillsRef.current.recovery) {
//                 const prevHealth = playerRef.current.getHealth();
//                 PassiveSkills.recovery(playerRef.current, true);

//                 // Update state if health changed
//                 if (playerRef.current.getHealth() !== prevHealth) {
//                     setPlayerHealth(playerRef.current.getHealth());
//                 }

//                 healingEffects.current = healingEffects.current.filter(effect => {
//                     effect.update();
//                     effect.draw(localCtx);
//                     return !effect.expired;
//                 });
//             }

//             // Momentum speed modifier
//             const speedModifier = passiveSkillsRef.current.momentum ?
//                 PassiveSkills.momentum(playerRef.current, true) :
//                 1.0;

//             playerRef.current.setSpeedModifier(speedModifier);

//             // Maintain correct number of drones
//             while (drones.current.length < maxDrones) {
//                 drones.current.push(new Drone(playerRef.current));
//             }
//             while (drones.current.length > maxDrones) {
//                 drones.current.pop();
//             }

//             // Update all drones
//             drones.current.forEach((drone, index) => {
//                 if (isPaused) return;
//                 drone.update(
//                     playerRef.current,
//                     enemies.current,
//                     bullets.current,
//                     drones.current, // Pass all drones for repulsion
//                     index,
//                     drones.current.length
//                 );
//             });


//             const currentHealth = playerRef.current.getHealth();
//             if (currentHealth !== playerHealth) {
//                 setPlayerHealth(currentHealth);
//             }

//             // Check for exit conditions *at the start* of the frame
//             if (!localCanvas || !localCtx || !localPlayer || isPaused) {
//                 console.warn("Animation cancelled - canvas, context, or player missing.");
//                 return;
//             }
//             if (win || gameOver) {
//                 // Still request next frame to potentially draw win/loss screen elements if needed,
//                 // but don't run game logic. Or just stop updating altogether.
//                 // For simplicity, let's stop the main game loop updates:
//                 // cancelAnimationFrame(animationFrameId); // Optional: truly stop
//                 // Clear screen if stopping updates
//                 // localCtx.clearRect(0, 0, localCanvas.width, localCanvas.height);
//                 animationFrameId = requestAnimationFrame(animate); // Keep requesting to handle potential UI changes
//                 return;
//             }

//             const now = Date.now();

//             // --- Player Updates ---
//             // Automatic weapon firing (call player method)
//             const weaponInfo = localPlayer.getCurrentWeaponInfo(); // Get current info
//             if (weaponInfo.isAutomatic && mouseDown.current) {
//                 // attemptFire checks rate limit, ammo, reload status internally
//                 const fired = localPlayer.attemptFire(mousePos.current, createBulletsCallbackForPlayer);
//                 if (fired || localPlayer.isReloading()) { // Update UI if fired or started reloading
//                     setCurrentAmmo(localPlayer.getCurrentAmmo());
//                     setIsReloading(localPlayer.isReloading());
//                     setReloadTime(localPlayer.getReloadTimeRemaining());
//                 }
//             }

//             // Handle reloading progress (call player method)
//             const reloadFinished = localPlayer.updateReload(now);
//             if (reloadFinished) {
//                 // Update UI state when reload finishes
//                 setCurrentAmmo(localPlayer.getCurrentAmmo());
//                 setIsReloading(localPlayer.isReloading());
//                 setReloadTime(localPlayer.getReloadTimeRemaining());
//             } else if (localPlayer.isReloading()) {
//                 // Update reload timer display if still reloading
//                 setReloadTime(localPlayer.getReloadTimeRemaining());
//             }


//             // Player movement & boundary checks (call player method)
//             const bounds = { width: localCanvas.width, height: localCanvas.height };
//             if (!isPaused) {
//                 localPlayer.update(keys.current, bounds);
//             }

//             // --- Turret Logic (Remains the same) ---
//             turrets.current.forEach(turret => {
//                 if (isPaused) return;
//                 let closestEnemy = null;
//                 let closestDistance = Infinity;
//                 enemies.current.forEach(enemy => {
//                     const distance = calculateDistance(turret.x, turret.y, enemy.x, enemy.y);
//                     if (distance < TURRET_CONFIG.range && distance < closestDistance) {
//                         closestDistance = distance;
//                         closestEnemy = enemy;
//                     }
//                 });
//                 turret.targetEnemy = closestEnemy;
//                 if (turret.targetEnemy) {
//                     const angle = Math.atan2(turret.targetEnemy.y - turret.y, turret.targetEnemy.x - turret.x);
//                     turret.angle = angle;
//                     if (Date.now() - turret.lastFireTime > TURRET_CONFIG.fireRate) {
//                         bullets.current.push({
//                             x: turret.x + Math.cos(angle) * TURRET_CONFIG.barrelLength,
//                             y: turret.y + Math.sin(angle) * TURRET_CONFIG.barrelLength,
//                             size: TURRET_CONFIG.bulletSize,
//                             velocity: { x: Math.cos(angle) * TURRET_CONFIG.bulletSpeed, y: Math.sin(angle) * TURRET_CONFIG.bulletSpeed },
//                             damage: TURRET_CONFIG.damage, weaponType: 'turret', angle: angle // Added angle for consistency
//                         });
//                         turret.lastFireTime = Date.now();
//                     }
//                 }
//             });


//             // --- Drawing ---
//             localCtx.clearRect(0, 0, localCanvas.width, localCanvas.height);

//             // Draw Player (call player method)
//             localPlayer.draw(localCtx, mousePos.current, playerImageRef.current);

//             // --- Update and Draw Bullets (Remains mostly the same) ---
//             // Use filter for slightly cleaner removal
//             bullets.current = bullets.current.filter((bullet, index) => {
//                 bullet.x += bullet.velocity.x;
//                 bullet.y += bullet.velocity.y;
//                 const distanceTravelled = bullet.maxDistance ? calculateDistance(bullet.x, bullet.y, bullet.startX, bullet.startY) : 0;

//                 // Removal conditions
//                 const outOfRange = bullet.maxDistance && distanceTravelled >= bullet.maxDistance;
//                 const outOfBounds = bullet.x < 0 || bullet.x > localCanvas.width || bullet.y < 0 || bullet.y > localCanvas.height;

//                 if (outOfRange || outOfBounds) {
//                     return false; // Remove bullet
//                 }

//                 // Draw bullet
//                 localCtx.save();
//                 localCtx.translate(bullet.x, bullet.y);
//                 localCtx.rotate(bullet.angle ?? 0); // Use angle from bullet object
//                 localCtx.fillStyle = bullet.weaponType === 'turret' ? '#FFA500' : '#FF0000'; // Different color for turret bullets
//                 localCtx.fillRect(-bullet.size / 2, -bullet.size / 2, bullet.size, bullet.size); // Center the rect
//                 localCtx.restore();

//                 return true; // Keep bullet
//             });

//             // Update UI timer display (can be fire cooldown or reload progress)
//             // Only update if not reloading - player.update handles reload time
//             if (!localPlayer.isReloading()) {
//                 const timeSinceFire = Date.now() - localPlayer.getCurrentWeaponInfo().lastFireTime;
//                 setReloadTime(Math.max(0, localPlayer.getCurrentWeaponInfo().fireRate - timeSinceFire));
//             }


//             const lineY = localCanvas.height - LINE_Y_OFFSET;

//             // Initialize and Draw Turrets (Remains the same)
//             turrets.current.forEach(turret => {
//                 if (isPaused) return;
//                 if (!turret.y) turret.y = lineY + 50;
//                 if (turret.x === null) turret.x = localCanvas.width - 50;
//                 // Draw base
//                 localCtx.fillStyle = TURRET_CONFIG.color;
//                 localCtx.beginPath(); localCtx.arc(turret.x, turret.y, TURRET_CONFIG.size / 2, 0, Math.PI * 2); localCtx.fill();
//                 // Draw barrel
//                 localCtx.save(); localCtx.translate(turret.x, turret.y); localCtx.rotate(turret.angle);
//                 localCtx.fillStyle = TURRET_CONFIG.barrelColor;
//                 localCtx.fillRect(TURRET_CONFIG.size / 4, -TURRET_CONFIG.size / 8, TURRET_CONFIG.barrelLength, TURRET_CONFIG.size / 4);
//                 localCtx.restore();
//                 // Draw range circle
//                 localCtx.beginPath(); localCtx.arc(turret.x, turret.y, TURRET_CONFIG.range, 0, Math.PI * 2);
//                 localCtx.strokeStyle = 'rgba(100, 100, 100, 0.2)'; localCtx.stroke();
//             });


//             // --- Update, Draw, and Check Collisions for Enemies ---
//             enemies.current = enemies.current.filter((enemy) => {
//                 if (isPaused) return true;

//                 // --- Enemy Movement --- (Logic remains the same)
//                 enemy.x += enemy.velocity.x;
//                 enemy.y += enemy.velocity.y;
//                 enemy.velocity.x *= 0.9; // Dampen knockback
//                 enemy.velocity.y *= 0.9;

//                 const maxY = lineY - enemy.size;
//                 if (enemy.type === 'fast') {
//                     const playerPos = localPlayer.getPosition();
//                     const distToPlayer = calculateDistance(playerPos.x, playerPos.y, enemy.x, enemy.y);

//                     if (distToPlayer > 0) {
//                         // Apply movement as velocity instead of direct position changes
//                         enemy.velocity.x += ((playerPos.x - enemy.x) / distToPlayer) * enemy.speed * 0.1;
//                         enemy.velocity.y += ((playerPos.y - enemy.y) / distToPlayer) * enemy.speed * 0.1;
//                     }

//                     // Keep these existing lines for knockback damping
//                     enemy.velocity.x *= 0.9;
//                     enemy.velocity.y *= 0.9;

//                     // Apply velocity
//                     enemy.x += enemy.velocity.x;
//                     enemy.y += enemy.velocity.y;


//                 } else { // Normal and Tank
//                     if (enemy.y < maxY) enemy.isStopped = false;
//                     if (!enemy.isStopped) enemy.y += enemy.speed;
//                     if (enemy.y > maxY) {
//                         enemy.y = maxY;
//                         enemy.isStopped = true;
//                         if (!enemy.damageInterval && baseHealth > 0) { // Only set interval if base has health
//                             enemy.damageInterval = setInterval(() => {
//                                 // Check win/gameOver inside interval callback too
//                                 if (win || gameOver) {
//                                     clearInterval(enemy.damageInterval);
//                                     enemy.damageInterval = null;
//                                     return;
//                                 }
//                                 setBaseHealth(prev => Math.max(0, prev - enemy.damage));
//                             }, BASE_DAMAGE_INTERVAL);
//                         }
//                     }
//                 }
//                 enemy.x = Math.max(0, Math.min(localCanvas.width - enemy.size, enemy.x)); // Clamp horizontal position


//                 // --- Enemy Drawing --- (Logic remains the same)
//                 let color;
//                 switch (enemy.type) {
//                     case 'fast': color = '#00ffff'; break;
//                     case 'tank': color = '#006400'; break;
//                     case 'drone': ctx.fillStyle = '#00ffff'; break;
//                     default: color = 'red';
//                 }
//                 localCtx.fillStyle = color; localCtx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
//                 // Health Bar
//                 localCtx.fillStyle = "black"; localCtx.fillRect(enemy.x, enemy.y - 10, enemy.size, 5);
//                 localCtx.fillStyle = "green"; localCtx.fillRect(enemy.x, enemy.y - 10, (enemy.health / enemy.maxHealth) * enemy.size, 5);


//                 // --- Bullet-Enemy Collision ---
//                 let hitByBullet = false;
//                 bullets.current = bullets.current.filter((bullet) => {
//                     // Calculate bullet bounds (assuming bullet.size is diameter)
//                     const bulletSize = bullet.size;
//                     const bulletLeft = bullet.x - bulletSize / 2;
//                     const bulletRight = bullet.x + bulletSize / 2;
//                     const bulletTop = bullet.y - bulletSize / 2;
//                     const bulletBottom = bullet.y + bulletSize / 2;

//                     // Calculate enemy bounds
//                     const enemyLeft = enemy.x;
//                     const enemyRight = enemy.x + enemy.size;
//                     const enemyTop = enemy.y;
//                     const enemyBottom = enemy.y + enemy.size;

//                     // Check for AABB (rectangle) collision
//                     const collides = !(
//                         bulletRight < enemyLeft ||
//                         bulletLeft > enemyRight ||
//                         bulletBottom < enemyTop ||
//                         bulletTop > enemyBottom
//                     );

//                     if (collides) {
//                         const knockbackForce = bullet.weaponType === 'shotgun' ? 8 : (bullet.weaponType === 'turret' ? 1 : 0); // Add slight turret knockback?
//                         const angle = bullet.angle ?? 0; // Use bullet angle for knockback direction

//                         if (enemy.takeDamage(bullet.damage, knockbackForce, angle)) {
//                             hitByBullet = true;
//                             setScore(prev => prev + enemy.score);

//                             // Get actual damage dealt (minimum of bullet damage and enemy health)
//                             const damageDealt = Math.min(bullet.damage, enemy.health);
//                             const healAmount = PassiveSkills.lifeSteal(damageDealt, passiveSkillsRef.current.lifeSteal);
//                             if (healAmount > 0) {
//                                 playerRef.current.heal(healAmount);
//                                 setPlayerHealth(playerRef.current.getHealth());
//                             }
//                         }

//                         // Add life steal
//                         const healAmount = PassiveSkills.lifeSteal(bullet.damage, passiveSkillsRef.current.lifeSteal);
//                         if (healAmount > 0) {
//                             playerRef.current.heal(healAmount);
//                             setPlayerHealth(playerRef.current.getHealth());
//                         }
//                         return false; // Remove bullet after collision
//                     }
//                     return !collides; // Keep bullet if no collision
//                 });
//                 if (hitByBullet) {
//                     clearInterval(enemy.damageInterval); // Clear interval immediately on kill
//                     enemy.damageInterval = null;
//                     return false; // Remove enemy killed by bullet
//                 }


//                 // --- Player-Enemy Collision ---
//                 const playerPos = localPlayer.getPosition();
//                 const playerRadius = localPlayer.getRadius();
//                 // Approximate collision check (center-to-center distance vs sum of radii/sizes)
//                 const distPlayerEnemy = calculateDistance(enemy.x + enemy.size / 2, enemy.y + enemy.size / 2, playerPos.x, playerPos.y);
//                 if (distPlayerEnemy < playerRadius + enemy.size / 2) {
//                     // Player takes damage
//                     handlePlayerDamage(enemy.damage, enemy);

//                     setPlayerHealth(localPlayer.getHealth()); // Update UI state

//                     // Enemy takes minor damage from collision? (Optional)
//                     // enemy.takeDamage(1, 0, 0); // Example: 1 damage, no knockback

//                     // Optional: Apply knockback to enemy from player collision
//                     const knockbackAngle = Math.atan2(enemy.y - playerPos.y, enemy.x - playerPos.x);
//                     enemy.applyKnockback(15, knockbackAngle); // Apply some knockback
//                 }

//                 // Enemy health check (e.g., if damaged by player collision or other future sources)
//                 if (enemy.health <= 0 && !hitByBullet) { // Ensure score isn't added twice if killed by bullet and collision in same frame
//                     console.log("Enemy killed by non-bullet source");
//                     clearInterval(enemy.damageInterval);
//                     enemy.damageInterval = null;
//                     setScore(prev => prev + enemy.score);
//                     return false; // Remove enemy
//                 }

//                 // If enemy survived all checks, keep it
//                 return true;
//             });

//             // Draw Drones
//             drones.current.forEach(drone => drone.draw(localCtx));


//             // Draw Spawn Zones and Blue Line (Remains the same)
//             const spawnZoneWidth = localCanvas.width * 0.1;
//             localCtx.fillStyle = 'rgba(128, 128, 128, 0.2)';
//             localCtx.fillRect(0, 0, spawnZoneWidth, localCanvas.height); // Left
//             localCtx.fillRect(localCanvas.width - spawnZoneWidth, 0, spawnZoneWidth, localCanvas.height); // Right
//             localCtx.beginPath(); localCtx.moveTo(0, lineY); localCtx.lineTo(localCanvas.width, lineY);
//             localCtx.strokeStyle = 'blue'; localCtx.lineWidth = 4; localCtx.stroke();

//             // Request next frame
//             animationFrameId = requestAnimationFrame(animate);
//         };

//         // Start the animation loop
//         animationFrameId = requestAnimationFrame(animate);

//         // --- Cleanup ---
//         return () => {
//             console.log("Cleaning up GameScene effect...");
//             clearInterval(enemySpawnIntervalId); // Clear spawn interval
//             cancelAnimationFrame(animationFrameId); // Stop animation loop

//             // Clean up intervals on *all* enemies when component unmounts
//             enemies.current.forEach(enemy => {
//                 if (enemy.damageInterval) {
//                     clearInterval(enemy.damageInterval);
//                     enemy.damageInterval = null; // Good practice to nullify
//                 }
//             });

//             // Remove event listeners
//             window.removeEventListener('mousemove', handleMouseMove);
//             window.removeEventListener('mousedown', handleMouseDown);
//             window.removeEventListener('mouseup', handleMouseUp);
//             window.removeEventListener('keydown', handleKeyDown);
//             window.removeEventListener('keyup', handleKeyUp);
//             // No need for the empty resize listener removal
//         };
//         // Dependencies: Ensure all functions and refs used inside useEffect are listed
//         // Note: Listing state setters (like setScore) isn't usually necessary, but list state values (win, gameOver) if read.
//     }, [
//         win, gameOver, canvasRef, playerImageRef, handleMouseMove, handleMouseDown, handleMouseUp, handleKeyDown, handleKeyUp,
//         createBulletsCallbackForPlayer, win, gameOver, handleWeaponSwitch /* Add handleWeaponSwitch if used in keydown inside effect */
//         // Note: state setters like setScore, setBaseHealth, setPlayerHealth are stable and don't need to be dependencies.
//     ]);
//     return (
//         <>
//             {/* Conditional rendering for Win/Game Over screens */}
//             {win && <YouWin score={score} onRestart={handleRestart} />}
//             {gameOver && <GameOver score={score} onRestart={handleRestart} />}


//             {isPaused && (
//                 <div className="pause-overlay">
//                     <h2>Game Paused</h2>
//                     <p>Switch back to window to resume</p>
//                 </div>
//             )}

//             {/* Canvas is always rendered */}
//             <canvas ref={canvasRef} style={{ display: 'block' }} />

//             <PassiveSkillCheckboxes
//                 skills={passiveSkills}
//                 toggleSkill={toggleSkill}
//             />
//             {/* WeaponDisplay uses UI state variables */}
//             <WeaponDisplay
//                 currentWeapon={currentWeaponInfo} // Pass the weapon info state
//                 currentAmmo={currentAmmo}
//                 isReloading={isReloading}
//                 reloadTime={reloadTime} // This now represents cooldown OR reload time
//                 playerHealth={playerHealth}
//                 baseHealth={baseHealth}
//                 score={score}
//                 timeElapsed={timeElapsed}
//                 gameDuration={gameDuration}
//             />

//             <div className="drone-control">
//                 <button onClick={() => updateDroneCount(maxDrones - 1)}>-</button>
//                 <span>Drones: {maxDrones}</span>
//                 <button onClick={() => updateDroneCount(maxDrones + 1)}>+</button>
//             </div>
//         </>
//     );

// }

// const PassiveSkillCheckboxes = ({ skills, toggleSkill }) => (
//     <div className="passive-skills-ui">
//         {Object.entries(skills).map(([skill, isActive]) => (
//             <label key={skill}>
//                 <input
//                     type="checkbox"
//                     checked={isActive}
//                     onChange={() => toggleSkill(skill)}
//                 />
//                 {skill.charAt(0).toUpperCase() + skill.slice(1)}
//             </label>
//         ))}
//     </div>
// );

// const GameOver = ({ score, onRestart }) => (
//     <div className="screen game-over-screen">
//         <h2>Game Over!</h2>
//         <p>Final Score: {score}</p>
//         <button
//             className="restart-button"
//             onClick={onRestart}
//             autoFocus
//         >
//             Play Again
//         </button>
//     </div>
// );


// const YouWin = ({ score, onRestart }) => (
//     <div className="screen win-screen">
//         <h2>Victory!</h2>
//         <p>Total Score: {score}</p>
//         <button
//             className="restart-button"
//             onClick={onRestart}
//             autoFocus
//         >
//             Play Again
//         </button>
//     </div>
// );

// const WeaponDisplay = ({
//     currentWeapon,
//     currentAmmo,
//     isReloading,
//     reloadTime,
//     playerHealth,
//     baseHealth,
//     score,
//     timeElapsed,
//     gameDuration
// }) => {
//     const timeLeft = Math.max(0, gameDuration - timeElapsed);
//     const minutes = Math.floor(timeLeft / 60000);
//     const seconds = Math.floor((timeLeft % 60000) / 1000);

//     return (
//         <div className="weapon_display">
//             <div>Score: {score}</div>
//             <div>Time Remaining: {minutes}:{seconds.toString().padStart(2, '0')}</div>
//             <div className="key"
//                 style={{
//                     display: 'flex',
//                     flexDirection: 'row',
//                     gap: "10px"
//                 }}>
//                 <p className={`${currentWeapon.name === 'pistol' ? "active" : ""}`}>1</p>
//                 <p className={`${currentWeapon.name === 'shotgun' ? "active" : ""}`}>2</p>
//                 <p className={`${currentWeapon.name === 'machinegun' ? "active" : ""}`}>3</p>
//             </div>
//             <h3>Weapon: {currentWeapon.name}</h3>
//             <p>Ammo: {currentAmmo} / {currentWeapon.maxAmmo}</p>
//             <p>{isReloading ? `Reloading... ${Math.ceil(reloadTime)}mas` : "Ready to fire"}</p>
//             <p>Player Health: {playerHealth}</p>
//             <p>Base Health: {baseHealth}</p>
//         </div>
//     );
// };

// export default GameScene;