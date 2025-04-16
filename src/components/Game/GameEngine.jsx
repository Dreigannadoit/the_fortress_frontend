import { useEffect, useState, useRef, useCallback } from "react";
import { PassiveSkills } from "../../systems/PassiveSkills";
import Player from "../../entities/Player";
import Enemy from "../../entities/Enemy";
import Drone from "../../entities/Drone";
import { TURRET_CONFIG, ENEMY_SPAWN_COUNT, ENEMY_SPAWN_INTERVAL, BASE_DAMAGE_INTERVAL, INITIAL_BASE_HEALTH, LINE_Y_OFFSET, weapons, ITEM_SPAWN_INTERVAL, ITEM_SPAWN_CHANCE } from "../../constansts/constants";
import calculateDistance from "../../utils/calculateDistance";
import { getRandomEnemyType } from "../../utils/getRandomEnemyType";
import { Item } from "../../entities/Item";


const useGameEngine = (canvasRef, playerSpriteRefs, gameDuration, fortressImageRef) => {
    const gunOffset = 24;

    // Game state
    const [win, setWin] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [baseHealth, setBaseHealth] = useState(INITIAL_BASE_HEALTH);
    const [score, setScore] = useState(0);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [enemyScalingFactor, setEnemyScalingFactor] = useState(1);

    // Player state
    const [playerHealth, setPlayerHealth] = useState(100);
    const [currentWeaponInfo, setCurrentWeaponInfo] = useState(weapons.pistol);
    const [currentAmmo, setCurrentAmmo] = useState(weapons.pistol.maxAmmo);
    const [isReloading, setIsReloading] = useState(false);
    const [reloadTime, setReloadTime] = useState(0);
    const [itemSpawnTimer, setItemSpawnTimer] = useState(0);
    const [passiveSkills, setPassiveSkills] = useState({
        recovery: false,
        lifeSteal: false,
        thorns: false,
        momentum: false,
        fastReload: false
    });
    const [maxDrones, setMaxDrones] = useState(4);

    // Refs for game objects
    const playerRef = useRef(null);
    const drones = useRef([]);
    const turrets = useRef([
        { x: 150, y: null, angle: 0, targetEnemy: null, lastFireTime: 0 },
        { x: null, y: null, angle: 0, targetEnemy: null, lastFireTime: 0 }
    ]);
    const bullets = useRef([]);
    const enemies = useRef([]);
    const items = useRef([]);

    // Add enemy sprite refs
    const enemySpriteRefs = useRef({
        normal: Array(8).fill().map(() => ({ current: null })),
        fast: Array(8).fill().map(() => ({ current: null })),
        tank: Array(8).fill().map(() => ({ current: null }))
    });

    const mousePos = useRef({ x: 0, y: 0 });
    const keys = useRef({ w: false, a: false, s: false, d: false, spacebar: false });
    const mouseDown = useRef(false);
    const passiveSkillsRef = useRef(passiveSkills);

    // Initialize player
    useEffect(() => {
        if (playerRef.current === null) {
            playerRef.current = new Player(window.innerWidth / 2, window.innerHeight / 2);
            setPlayerHealth(playerRef.current.getHealth());
            setCurrentWeaponInfo(playerRef.current.getCurrentWeaponInfo());
            setCurrentAmmo(playerRef.current.getCurrentAmmo());
        }
    }, []);

    // Preload enemy sprites
    useEffect(() => {
        const types = ['normal', 'fast', 'tank'];
        types.forEach(type => {
            for (let i = 0; i < 8; i++) {
                const img = new Image();
                // Use absolute path from public folder or correct relative path
                img.src = `src/assets/animation/${type}/${type}_${i}.png`;
                img.onload = () => {
                    enemySpriteRefs.current[type][i].current = img;
                };
                img.onerror = () => {
                    console.error(`Failed to load: ${img.src}`);
                };
            }
        });
    }, []);

    const spawnItem = useCallback(() => {
        if (Math.random() < ITEM_SPAWN_CHANCE) {
            const canvas = canvasRef.current;
            if (!canvas) return;
            
            // Random position in safe zone (not too close to edges)
            const padding = 100;
            const x = padding + Math.random() * (canvas.width - padding * 2);
            const y = padding + Math.random() * (canvas.height - padding * 2);
            
            // Create medkit with healing effect
            const medkit = new Item(x, y, 'medkit', (player) => {
                player.heal(30); // Heal 30 HP
                return true; // Item was successfully used
            });
            
            items.current.push(medkit);
        }
    }, []);

    useEffect(() => {
        if (win || gameOver) return;
        
        const itemInterval = setInterval(() => {
            setItemSpawnTimer(prev => {
                const newTime = prev + 1000;
                if (newTime >= ITEM_SPAWN_INTERVAL) {
                    spawnItem();
                    return 0;
                }
                return newTime;
            });
        }, 1000);
        
        return () => clearInterval(itemInterval);
    }, [win, gameOver, spawnItem]);

    const checkItemCollisions = useCallback(() => {
        const player = playerRef.current;
        if (!player) return;
        
        const playerPos = player.getPosition();
        const playerRadius = player.getRadius();
        
        items.current = items.current.filter(item => {
            if (item.collected) return false;
            
            // Check distance to player
            const distance = calculateDistance(
                playerPos.x, playerPos.y,
                item.x, item.y
            );
            
            if (distance < playerRadius + item.size/2) {
                // Apply item effect
                const success = item.effect(player);
                if (success) {
                    setPlayerHealth(player.getHealth());
                    return false; // Remove collected item
                }
            }
            
            return true; // Keep uncollected item
        });
    }, []);
    

    // Game logic methods
    const createBullet = useCallback((x, y, size, bulletSpeed, angle, range, damage, weaponType) => ({
        x, y, size,
        velocity: { x: Math.cos(angle) * bulletSpeed, y: Math.sin(angle) * bulletSpeed },
        startX: x, startY: y, maxDistance: range, damage, angle, weaponType,
    }), []);

    const createBulletsCallbackForPlayer = useCallback((player, weapon, mousePosition) => {
        const playerPos = player.getPosition();
        const angle = Math.atan2(mousePosition.y - playerPos.y, mousePosition.x - playerPos.x);
        const bulletStartX = playerPos.x + Math.cos(angle + Math.PI / 2) * gunOffset;
        const bulletStartY = playerPos.y + Math.sin(angle + Math.PI / 2) * gunOffset;

        if (weapon.name === 'shotgun') {
            const spread = weapon.spread;
            const pelletAngles = Array.from({ length: weapon.pellets }, (_, i) =>
                angle - spread / 2 + (i * spread) / (weapon.pellets - 1)
            );
            pelletAngles.forEach(pelletAngle => {
                bullets.current.push(createBullet(
                    bulletStartX, bulletStartY, weapon.bulletSize, weapon.bulletSpeed,
                    pelletAngle, weapon.range, weapon.damage, weapon.name
                ));
            });
        } else {
            bullets.current.push(createBullet(
                bulletStartX, bulletStartY, weapon.bulletSize, weapon.bulletSpeed,
                angle, weapon.range, weapon.damage, weapon.name
            ));
        }
    }, [createBullet]);

    const handlePlayerDamage = useCallback((damage, attacker) => {
        const player = playerRef.current;
        if (!player) return;

        if (player.canTakeDamage()) {
            PassiveSkills.thorns(damage, attacker, passiveSkillsRef.current.thorns);
            if (player.takeDamage(damage)) {
                setGameOver(true);
            }
        }
        setPlayerHealth(player.getHealth());
    }, []);

    const handleRestart = useCallback(() => {
        // Reset all state variables
        setWin(false);
        setGameOver(false);
        setBaseHealth(INITIAL_BASE_HEALTH);
        setScore(0);
        setTimeElapsed(0);
        setEnemyScalingFactor(1);
        items.current = [];
        setItemSpawnTimer(0);

        // Reset player state
        if (playerRef.current) {
            playerRef.current.reset(window.innerWidth / 2, window.innerHeight / 2);
            setPlayerHealth(playerRef.current.getHealth());
            setCurrentWeaponInfo(playerRef.current.getCurrentWeaponInfo());
            setCurrentAmmo(playerRef.current.getCurrentAmmo());
            setIsReloading(false);
            setReloadTime(0);
        }

        // Reset game objects
        turrets.current = [
            { x: 50, y: null, angle: 0, targetEnemy: null, lastFireTime: 0 },
            { x: null, y: null, angle: 0, targetEnemy: null, lastFireTime: 0 }
        ];
        bullets.current = [];
        enemies.current = [];
        drones.current = [];

        // Reset input states
        keys.current = { w: false, a: false, s: false, d: false, spacebar: false };
        mouseDown.current = false;
        mousePos.current = { x: 0, y: 0 };
    }, [INITIAL_BASE_HEALTH]);

    // Input handlers
    const handleMouseMove = useCallback((e) => {
        mousePos.current = { x: e.clientX, y: e.clientY };
    }, []);

    const handleWeaponFire = useCallback(() => {
        const player = playerRef.current;
        if (!player) return;

        player.attemptFire(mousePos.current, createBulletsCallbackForPlayer);
        setCurrentAmmo(player.getCurrentAmmo());
        setIsReloading(player.isReloading());
        setReloadTime(player.getReloadTimeRemaining());
    }, [createBulletsCallbackForPlayer]);

    const handleMouseDown = useCallback((e) => {
        mouseDown.current = true;
        const player = playerRef.current;
        if (player && !player.getCurrentWeaponInfo().isAutomatic) {
            handleWeaponFire();
        }
    }, [handleWeaponFire]);

    const handleMouseUp = useCallback(() => {
        mouseDown.current = false;
    }, []);

    const handleWeaponSwitch = useCallback((weaponName) => {
        const player = playerRef.current;
        if (!player) return;

        player.switchWeapon(weaponName);
        const newWeaponInfo = player.getCurrentWeaponInfo();
        setCurrentWeaponInfo(newWeaponInfo);
        setCurrentAmmo(player.getCurrentAmmo());
        setIsReloading(player.isReloading());
        setReloadTime(player.getReloadTimeRemaining());
    }, []);

    const handleKeyDown = useCallback((e) => {
        const key = e.key.toLowerCase();
        if (keys.current.hasOwnProperty(key)) keys.current[key] = true;

        switch (key) {
            case '1': handleWeaponSwitch('pistol'); break;
            case '2': handleWeaponSwitch('shotgun'); break;
            case '3': handleWeaponSwitch('machinegun'); break;
            case 'r':
                playerRef.current?.startReload();
                setIsReloading(playerRef.current?.isReloading() ?? false);
                setReloadTime(playerRef.current?.getReloadTimeRemaining() ?? 0);
                break;
            default: break;
        }
    }, [handleWeaponSwitch]);

    const handleKeyUp = useCallback((e) => {
        const key = e.key.toLowerCase();
        if (keys.current.hasOwnProperty(key)) keys.current[key] = false;
    }, []);

    // Game systems
    useEffect(() => {
        passiveSkillsRef.current = passiveSkills;
    }, [passiveSkills]);

    useEffect(() => {
        if (passiveSkills.fastReload && playerRef.current) {
            playerRef.current.setReloadModifier(0.7);
        } else if (playerRef.current) {
            playerRef.current.setReloadModifier(1.0);
        }
    }, [passiveSkills.fastReload]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsPaused(document.hidden);
            if (document.hidden) {
                keys.current = { w: false, a: false, s: false, d: false, spacebar: false };
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Game state checks
    useEffect(() => {
        if (timeElapsed >= gameDuration && !win && !gameOver) {
            setWin(true);
        }
    }, [timeElapsed, gameDuration, win, gameOver]);

    useEffect(() => {
        if ((playerHealth <= 0 || baseHealth <= 0) && !gameOver && !win) {
            setGameOver(true);
        }
    }, [playerHealth, baseHealth, gameOver, win]);

    // Timer systems
    useEffect(() => {
        if (win || gameOver) return;
        const timerInterval = setInterval(() => {
            setTimeElapsed(prev => prev + 1000);
        }, 1000);
        return () => clearInterval(timerInterval);
    }, [win, gameOver]);

    useEffect(() => {
        if (win || gameOver) return;
        const scalingInterval = setInterval(() => {
            setEnemyScalingFactor(prev => prev * 1.5);
        }, 30000);
        return () => clearInterval(scalingInterval);
    }, [win, gameOver]);

    // Main game loop
    useEffect(() => {
        if (!canvasRef.current || !playerRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let enemySpawnIntervalId;

        const spawnEnemy = () => {
            if (isPaused || win || gameOver || !canvasRef.current) return;

            const canvas = canvasRef.current;
            const spawnZoneWidth = canvas.width * 0.1;
            const minX = spawnZoneWidth;
            const maxX = canvas.width - (spawnZoneWidth + 0.05 * canvas.width);
            const cellSize = 200; // Grid cell size
            const grid = {};
            const newEnemies = [];

            // Helper function to get grid key
            const getGridKey = (x, y) => `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)}`;

            // Mark existing enemies in grid
            enemies.current.forEach(enemy => {
                const key = getGridKey(enemy.x, enemy.y);
                grid[key] = true;
            });

            for (let i = 0; i < ENEMY_SPAWN_COUNT; i++) {
                const type = getRandomEnemyType();
                const y = -100;
                let x;
                let validPosition = false;
                let attempts = 0;

                while (!validPosition && attempts < 10) {
                    attempts++;
                    x = Math.random() * (maxX - minX) + minX;
                    const key = getGridKey(x, y);

                    if (!grid[key]) {
                        validPosition = true;
                        grid[key] = true; // Mark this cell as occupied
                    }
                }

                if (validPosition) {
                    const enemy = new Enemy(x, y, type, enemyScalingFactor);
                    enemy.setSpriteRefs(enemySpriteRefs.current[type]);
                    newEnemies.push(enemy);
                }
            }

            enemies.current.push(...newEnemies);
        };

        const updateGame = () => {
            if (isPaused || !ctx || !canvas) {
                animationFrameId = requestAnimationFrame(updateGame);
                return;
            }

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update game state
            updatePlayer();
            updateEnemies();
            updateBullets();
            updateTurrets();
            updateDrones();
            updateItems();

            // Draw game objects:
            drawEnvironment(); 
            drawItems(); 
            drawPlayer();
            drawFortress();    
            drawEnemies();
            drawBullets();
            drawDrones();
            drawTurrets();     
            drawCursor();

            // Collision Item check
            checkItemCollisions();

            animationFrameId = requestAnimationFrame(updateGame);
        };

        const updatePlayer = () => {
            const player = playerRef.current;
            if (!player) return;

            // Handle automatic weapon firing
            const weaponInfo = player.getCurrentWeaponInfo();
            if (weaponInfo.isAutomatic && mouseDown.current) {
                const fired = player.attemptFire(mousePos.current, createBulletsCallbackForPlayer);
                if (fired || player.isReloading()) {
                    setCurrentAmmo(player.getCurrentAmmo());
                    setIsReloading(player.isReloading());
                    setReloadTime(player.getReloadTimeRemaining());
                }
            }

            // Handle reloading
            const reloadFinished = player.updateReload(Date.now());
            if (reloadFinished) {
                setCurrentAmmo(player.getCurrentAmmo());
                setIsReloading(player.isReloading());
                setReloadTime(player.getReloadTimeRemaining());
            } else if (player.isReloading()) {
                setReloadTime(player.getReloadTimeRemaining());
            }

            // Apply passive skills
            if (passiveSkillsRef.current.recovery) {
                const prevHealth = player.getHealth();
                PassiveSkills.recovery(player, true);
                if (player.getHealth() !== prevHealth) {
                    setPlayerHealth(player.getHealth());
                }
            }

            // Update player movement
            const speedModifier = passiveSkillsRef.current.momentum ?
                PassiveSkills.momentum(player, true) : 1.0;
            player.setSpeedModifier(speedModifier);
            player.update(keys.current, { width: canvas.width, height: canvas.height });
        };

        const updateEnemies = () => {
            const lineY = canvas.height - LINE_Y_OFFSET;
            enemies.current = enemies.current.filter((enemy) => {
                if (isPaused) return true;

                // Update enemy position
                enemy.x += enemy.velocity.x;
                enemy.y += enemy.velocity.y;
                enemy.velocity.x *= 0.9;
                enemy.velocity.y *= 0.9;

                const maxY = lineY - enemy.size;

                // Behavior-specific updates
                if (enemy.type === 'fast') {
                    const playerPos = playerRef.current.getPosition();
                    const distToPlayer = calculateDistance(playerPos.x, playerPos.y, enemy.x, enemy.y);

                    // Always move toward player
                    if (distToPlayer > 0) {
                        enemy.velocity.x += ((playerPos.x - enemy.x) / distToPlayer) * enemy.speed * 0.1;
                        enemy.velocity.y += ((playerPos.y - enemy.y) / distToPlayer) * enemy.speed * 0.1;
                    }

                    // Clamp fast enemy from passing maxY
                    if (enemy.y > maxY) {
                        enemy.y = maxY;
                        enemy.velocity.y = 0;
                    }

                } else { // Normal and Tank enemies
                    if (enemy.y < maxY) enemy.isStopped = false;
                    if (!enemy.isStopped) enemy.y += enemy.speed;
                    if (enemy.y > maxY) {
                        enemy.y = maxY;
                        enemy.isStopped = true;
                        if (!enemy.damageInterval && baseHealth > 0) {
                            enemy.damageInterval = setInterval(() => {
                                if (win || gameOver) {
                                    clearInterval(enemy.damageInterval);
                                    enemy.damageInterval = null;
                                    return;
                                }
                                setBaseHealth(prev => Math.max(0, prev - enemy.damage));
                            }, BASE_DAMAGE_INTERVAL);
                        }
                    }
                }

                // Boundary check
                enemy.x = Math.max(0, Math.min(canvas.width - enemy.size, enemy.x));

                // Check for collisions with bullets
                let hitByBullet = false;
                bullets.current = bullets.current.filter((bullet) => {
                    if (checkCollision(bullet, enemy)) {
                        const knockbackForce = bullet.weaponType === 'shotgun' ? 8 :
                            (bullet.weaponType === 'turret' ? 1 : 0);
                        const angle = bullet.angle ?? 0;

                        if (enemy.takeDamage(bullet.damage, knockbackForce, angle)) {
                            hitByBullet = true;
                            setScore(prev => prev + enemy.score);

                            // Life steal effect
                            const damageDealt = Math.min(bullet.damage, enemy.health);
                            const healAmount = PassiveSkills.lifeSteal(damageDealt, passiveSkillsRef.current.lifeSteal);
                            if (healAmount > 0) {
                                playerRef.current.heal(healAmount);
                                setPlayerHealth(playerRef.current.getHealth());
                            }
                        }
                        return false; // Remove bullet
                    }
                    return true; // Keep bullet
                });

                // Check for collisions with player
                if (checkPlayerCollision(enemy)) {
                    handlePlayerDamage(enemy.damage, enemy);
                    const knockbackAngle = Math.atan2(enemy.y - playerRef.current.y, enemy.x - playerRef.current.x);
                    enemy.applyKnockback(15, knockbackAngle);
                }

                // Remove dead enemies
                if (enemy.health <= 0) {
                    if (enemy.damageInterval) {
                        clearInterval(enemy.damageInterval);
                        enemy.damageInterval = null;
                    }
                    if (!hitByBullet) setScore(prev => prev + enemy.score);
                    return false;
                }

                return true;
            });
        };
        
        const updateItems = () => {
            items.current = items.current.filter(item => {
                item.update();
                return !item.collected;
            });
        };

        const updateBullets = () => {
            bullets.current = bullets.current.filter((bullet) => {
                bullet.x += bullet.velocity.x;
                bullet.y += bullet.velocity.y;

                // Check if bullet is out of bounds or range
                const distanceTravelled = bullet.maxDistance ?
                    calculateDistance(bullet.x, bullet.y, bullet.startX, bullet.startY) : 0;

                const outOfRange = bullet.maxDistance && distanceTravelled >= bullet.maxDistance;
                const outOfBounds = bullet.x < 0 || bullet.x > canvas.width ||
                    bullet.y < 0 || bullet.y > canvas.height;

                return !(outOfRange || outOfBounds);
            });
        };

        const updateTurrets = () => {
            turrets.current.forEach(turret => {
                if (isPaused) return;

                // Position turrets if not already positioned
                if (!turret.y) turret.y = canvas.height - LINE_Y_OFFSET + 50;
                if (turret.x === null) turret.x = canvas.width - 150;

                // Find closest enemy
                let closestEnemy = null;
                let closestDistance = Infinity;
                enemies.current.forEach(enemy => {
                    const distance = calculateDistance(turret.x, turret.y, enemy.x, enemy.y);
                    if (distance < TURRET_CONFIG.range && distance < closestDistance) {
                        closestDistance = distance;
                        closestEnemy = enemy;
                    }
                });

                // Update turret targeting and firing
                turret.targetEnemy = closestEnemy;
                if (turret.targetEnemy) {
                    turret.angle = Math.atan2(
                        turret.targetEnemy.y - turret.y,
                        turret.targetEnemy.x - turret.x
                    );

                    if (Date.now() - turret.lastFireTime > TURRET_CONFIG.fireRate) {
                        bullets.current.push({
                            x: turret.x + Math.cos(turret.angle) * TURRET_CONFIG.barrelLength,
                            y: turret.y + Math.sin(turret.angle) * TURRET_CONFIG.barrelLength,
                            size: TURRET_CONFIG.bulletSize,
                            velocity: {
                                x: Math.cos(turret.angle) * TURRET_CONFIG.bulletSpeed,
                                y: Math.sin(turret.angle) * TURRET_CONFIG.bulletSpeed
                            },
                            damage: TURRET_CONFIG.damage,
                            weaponType: 'turret',
                            angle: turret.angle
                        });
                        turret.lastFireTime = Date.now();
                    }
                }
            });
        };

        const updateDrones = () => {
            // Maintain correct number of drones
            while (drones.current.length < maxDrones) {
                drones.current.push(new Drone(playerRef.current));
            }
            while (drones.current.length > maxDrones) {
                drones.current.pop();
            }

            // Update each drone
            drones.current.forEach((drone, index) => {
                if (isPaused) return;
                drone.update(
                    playerRef.current,
                    enemies.current,
                    bullets.current,
                    drones.current,
                    index,
                    drones.current.length
                );
            });
        };

        // Draw methods
        const drawFortress = () => {
            const lineY = canvas.height - LINE_Y_OFFSET;
        
            if (!fortressImageRef.current) return;
        
            // Calculate height from the line down
            const fortressHeight = canvas.height - lineY;
        
            // Draw one scaled image to span the entire canvas width
            ctx.drawImage(
                fortressImageRef.current,
                0,
                lineY,
                canvas.width,
                fortressHeight
            );
        
            // Optional overlay for blending
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(0, lineY, canvas.width, fortressHeight);
        
            console.log("Fortress image loaded and stretched.");
        };

        const drawItems = () => {
            items.current.forEach(item => item.draw(ctx));
        };


        const drawPlayer = () => {
            const player = playerRef.current;
            if (!player) return;

            // Default weapon key
            const defaultWeapon = "pistol";

            // Get the appropriate sprite based on current weapon
            let currentSprite = playerSpriteRefs[player.currentWeaponType]?.current;

            if (!currentSprite) {
                currentSprite = playerSpriteRefs[defaultWeapon]?.current;
            }

            console.log("Current player weapon:", player.currentWeaponType);

            player.draw(ctx, mousePos.current, currentSprite);
        };

        const drawEnemies = () => {
            enemies.current.forEach(enemy => {
                enemy.draw(ctx);
            });
        };

        const drawCursor = () => {
            const player = playerRef.current;
            if (!player || !mousePos.current) return;

            const playerPos = player.getPosition();
            const angle = Math.atan2(mousePos.current.y - playerPos.y, mousePos.current.x - playerPos.x);

            // Calculate where bullets will actually spawn (the "true" aim point)
            const bulletSpawnX = playerPos.x + Math.cos(angle + Math.PI / 2) * gunOffset;
            const bulletSpawnY = playerPos.y + Math.sin(angle + Math.PI / 2) * gunOffset;

            // Calculate vector from bullet spawn to mouse position
            const cursorX = mousePos.current.x + Math.cos(angle + Math.PI / 2) * gunOffset;
            const cursorY = mousePos.current.y + Math.sin(angle + Math.PI / 2) * gunOffset;

            // Draw the custom cursor at the mouse position
            ctx.save();

            // Outer circle (white)
            ctx.beginPath();
            ctx.arc(cursorX, cursorY, 10, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(44, 44, 44, 0.2)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Inner circle (red)
            ctx.beginPath();
            ctx.arc(cursorX, cursorY, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'red';
            ctx.fill();

            // Draw line showing the offset correction
            ctx.beginPath();
            ctx.moveTo(bulletSpawnX, bulletSpawnY);
            ctx.lineTo(cursorX, cursorY);
            ctx.strokeStyle = 'rgba(184, 67, 67, 0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw small circle at bullet spawn point
            ctx.beginPath();
            ctx.arc(bulletSpawnX, bulletSpawnY, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'yellow';
            ctx.fill();

            ctx.restore();
        };

        const drawBullets = () => {
            bullets.current.forEach(bullet => {
                ctx.save();
                ctx.translate(bullet.x, bullet.y);
                ctx.rotate(bullet.angle ?? 0);
                ctx.fillStyle = bullet.weaponType === 'turret' ? '#FFA500' : '#FF0000';
                ctx.fillRect(-bullet.size / 2, -bullet.size / 2, bullet.size, bullet.size);
                ctx.restore();
            });
        };

        const drawTurrets = () => {
            const lineY = canvas.height - LINE_Y_OFFSET;
            turrets.current.forEach(turret => {
                if (!turret.y) turret.y = lineY + 50;
        
                const baseRadius = TURRET_CONFIG.size / 2;
                const barrelWidth = TURRET_CONFIG.size / 4;
                const barrelHeight = TURRET_CONFIG.size / 4;
                const barrelLength = TURRET_CONFIG.barrelLength;
        
                ctx.save();
        
                // --- Base with gradient and outline ---
                ctx.beginPath();
                ctx.arc(turret.x, turret.y, baseRadius, 0, Math.PI * 2);
                const baseGradient = ctx.createRadialGradient(
                    turret.x, turret.y - baseRadius / 2, baseRadius / 4,
                    turret.x, turret.y, baseRadius
                );
                baseGradient.addColorStop(0, '#666');
                baseGradient.addColorStop(1, '#333');
                ctx.fillStyle = baseGradient;
                ctx.fill();
        
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 2;
                ctx.stroke();
        
                // --- Top cap with steel effect and outline ---
                ctx.beginPath();
                ctx.arc(turret.x, turret.y, baseRadius * 0.9, 0, Math.PI * 2);
                const topGradient = ctx.createRadialGradient(
                    turret.x, turret.y, 0,
                    turret.x, turret.y, baseRadius * 0.9
                );
                topGradient.addColorStop(0, '#aaa');
                topGradient.addColorStop(1, '#555');
                ctx.fillStyle = topGradient;
                ctx.fill();
        
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 2;
                ctx.stroke();
        
                // --- Draw barrel ---
                ctx.save();
                ctx.translate(turret.x, turret.y);
                ctx.rotate(turret.angle);
        
                // Barrel base shadow
                ctx.fillStyle = '#222';
                ctx.fillRect(
                    baseRadius * 0.2,
                    -barrelHeight / 2,
                    barrelLength,
                    barrelHeight
                );
        
                // Barrel body with metallic gradient
                const barrelGradient = ctx.createLinearGradient(
                    0, -barrelHeight / 2,
                    0, barrelHeight / 2
                );
                barrelGradient.addColorStop(0, '#aaa');
                barrelGradient.addColorStop(0.5, '#888');
                barrelGradient.addColorStop(1, '#666');
        
                ctx.fillStyle = barrelGradient;
                ctx.fillRect(
                    baseRadius * 0.2,
                    -barrelHeight / 2,
                    barrelLength,
                    barrelHeight
                );
        
                // Top highlight
                ctx.fillStyle = '#ccc';
                ctx.fillRect(
                    baseRadius * 0.2,
                    -barrelHeight / 2,
                    barrelLength,
                    barrelHeight * 0.2
                );
        
                // Barrel outline
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    baseRadius * 0.2,
                    -barrelHeight / 2,
                    barrelLength,
                    barrelHeight
                );
        
                // Muzzle tip
                ctx.fillStyle = '#333';
                ctx.fillRect(
                    baseRadius * 0.2 + barrelLength,
                    -barrelHeight / 2,
                    barrelHeight * 0.5,
                    barrelHeight
                );
                ctx.strokeRect(
                    baseRadius * 0.2 + barrelLength,
                    -barrelHeight / 2,
                    barrelHeight * 0.5,
                    barrelHeight
                );
        
                // Mounting hardware
                ctx.beginPath();
                ctx.arc(0, 0, baseRadius * 0.3, 0, Math.PI * 2);
                ctx.fillStyle = '#444';
                ctx.fill();
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 2;
                ctx.stroke();
        
                ctx.restore();
        
                // --- Range circle ---
                ctx.beginPath();
                ctx.arc(turret.x, turret.y, TURRET_CONFIG.range, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(100, 100, 255, 0.1)';
                ctx.lineWidth = 2;
                ctx.stroke();
        
                ctx.restore();
        
                // --- Targeting line ---
                if (turret.targetEnemy) {
                    ctx.beginPath();
                    ctx.moveTo(turret.x, turret.y);
                    ctx.lineTo(turret.targetEnemy.x, turret.targetEnemy.y);
                    ctx.strokeStyle = 'rgba(255, 50, 50, 0.3)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            });
        };
        

        const drawDrones = () => {
            drones.current.forEach(drone => drone.draw(ctx));
        };

        const drawEnvironment = () => {
            const lineY = canvas.height - LINE_Y_OFFSET;
            const spawnZoneWidth = canvas.width * 0.1;

            // Draw spawn zones
            ctx.fillStyle = 'rgba(128, 128, 128, 0.2)';
            ctx.fillRect(0, 0, spawnZoneWidth, canvas.height); // Left
            ctx.fillRect(canvas.width - spawnZoneWidth, 0, spawnZoneWidth, canvas.height); // Right

            // Draw defense line
            ctx.beginPath();
            ctx.moveTo(0, lineY);
            ctx.lineTo(canvas.width, lineY);
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 4;
            ctx.stroke();
        };

        // Helper functions
        const checkCollision = (bullet, enemy) => {
            const bulletSize = bullet.size;
            const bulletLeft = bullet.x - bulletSize / 2;
            const bulletRight = bullet.x + bulletSize / 2;
            const bulletTop = bullet.y - bulletSize / 2;
            const bulletBottom = bullet.y + bulletSize / 2;

            return !(
                bulletRight < enemy.x ||
                bulletLeft > enemy.x + enemy.size ||
                bulletBottom < enemy.y ||
                bulletTop > enemy.y + enemy.size
            );
        };

        const checkPlayerCollision = (enemy) => {
            const player = playerRef.current;
            const playerPos = player.getPosition();
            const playerRadius = player.getRadius();
            const enemyCenterX = enemy.x + enemy.size / 2;
            const enemyCenterY = enemy.y + enemy.size / 2;

            return calculateDistance(enemyCenterX, enemyCenterY, playerPos.x, playerPos.y) <
                (playerRadius + enemy.size / 2);
        };

        // Start game systems
        if (!win && !gameOver && !isPaused) {
            enemySpawnIntervalId = setInterval(spawnEnemy, ENEMY_SPAWN_INTERVAL);
            animationFrameId = requestAnimationFrame(updateGame);
        }

        // Setup event listeners
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Cleanup
        return () => {
            clearInterval(enemySpawnIntervalId);
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);

            enemies.current.forEach(enemy => {
                if (enemy.damageInterval) {
                    clearInterval(enemy.damageInterval);
                    enemy.damageInterval = null;
                }
            });
        };
    }, [
        win, gameOver, isPaused, enemyScalingFactor,
        handleMouseMove, handleMouseDown, handleMouseUp, handleKeyDown, handleKeyUp,
        createBulletsCallbackForPlayer, handleWeaponSwitch
    ]);

    return {
        // State
        win,
        gameOver,
        isPaused,
        baseHealth,
        score,
        timeElapsed,
        playerHealth,
        currentWeaponInfo,
        currentAmmo,
        isReloading,
        reloadTime,
        passiveSkills,
        maxDrones,
        items: items.current,

        // Methods
        handleRestart,
        toggleSkill: (skill) => setPassiveSkills(prev => ({ ...prev, [skill]: !prev[skill] })),
        updateDroneCount: (newCount) => setMaxDrones(Math.max(0, newCount)),

        // Input handlers
        handleMouseMove,
        handleMouseDown,
        handleMouseUp,
        handleKeyDown,
        handleKeyUp,
        handleWeaponSwitch
    };
};

export default useGameEngine;