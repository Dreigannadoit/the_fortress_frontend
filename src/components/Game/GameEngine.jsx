import { useEffect, useState, useRef, useCallback } from "react";
import { PassiveSkills } from "../../systems/PassiveSkills";
import Player from "../../entities/Player";
import Enemy from "../../entities/Enemy";
import Drone from "../../entities/Drone";
import { TURRET_CONFIG, ENEMY_SPAWN_COUNT, ENEMY_SPAWN_INTERVAL, BASE_DAMAGE_INTERVAL, INITIAL_BASE_HEALTH, LINE_Y_OFFSET, weapons } from "../../constansts/constants";
import calculateDistance from "../../utils/calculateDistance";

const useGameEngine = (canvasRef, playerImageRef, gameDuration) => {
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
    const [passiveSkills, setPassiveSkills] = useState({
        recovery: false,
        lifeSteal: false,
        thorns: false,
        momentum: false,
        fastReload: false
    });
    const [maxDrones, setMaxDrones] = useState(0);

    // Refs for game objects
    const playerRef = useRef(null);
    const drones = useRef([]);
    const turrets = useRef([
        { x: 50, y: null, angle: 0, targetEnemy: null, lastFireTime: 0 },
        { x: null, y: null, angle: 0, targetEnemy: null, lastFireTime: 0 }
    ]);
    const bullets = useRef([]);
    const enemies = useRef([]);
    const mousePos = useRef({ x: 0, y: 0 });
    const keys = useRef({ w: false, a: false, s: false, d: false, spacebar: false });
    const mouseDown = useRef(false);
    const passiveSkillsRef = useRef(passiveSkills);
    const healingEffects = useRef([]);

    // Initialize player
    useEffect(() => {
        if (playerRef.current === null) {
            playerRef.current = new Player(window.innerWidth / 2, window.innerHeight / 2);
            setPlayerHealth(playerRef.current.getHealth());
            setCurrentWeaponInfo(playerRef.current.getCurrentWeaponInfo());
            setCurrentAmmo(playerRef.current.getCurrentAmmo());
        }
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
        const gunOffset = 15;
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
            setEnemyScalingFactor(prev => prev * 1.2);
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
            if (isPaused || win || gameOver) return;

            for (let i = 0; i < ENEMY_SPAWN_COUNT; i++) {
                const type = getRandomEnemyType();
                const y = -10;
                const spawnZoneWidth = canvas.width * 0.1;
                const minX = spawnZoneWidth;
                const maxX = canvas.width - (spawnZoneWidth + 0.05 * canvas.width);
                const x = Math.random() * (maxX - minX) + minX;
                enemies.current.push(new Enemy(x, y, type, enemyScalingFactor));
            }
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

            // Draw game objects
            drawPlayer();
            drawEnemies();
            drawBullets();
            drawTurrets();
            drawDrones();
            drawEnvironment();

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
                if (turret.x === null) turret.x = canvas.width - 50;

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
        const drawPlayer = () => {
            const player = playerRef.current;
            if (!player) return;
            player.draw(ctx, mousePos.current, playerImageRef.current);
        };

        const drawEnemies = () => {
            enemies.current.forEach(enemy => {
                // Draw enemy body
                let color;
                switch (enemy.type) {
                    case 'fast': color = '#00ffff'; break;
                    case 'tank': color = '#006400'; break;
                    default: color = 'red';
                }
                ctx.fillStyle = color;
                ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);

                // Draw health bar
                ctx.fillStyle = "black";
                ctx.fillRect(enemy.x, enemy.y - 10, enemy.size, 5);
                ctx.fillStyle = "green";
                ctx.fillRect(enemy.x, enemy.y - 10, (enemy.health / enemy.maxHealth) * enemy.size, 5);
            });
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
                // Draw base
                ctx.fillStyle = TURRET_CONFIG.color;
                ctx.beginPath();
                ctx.arc(turret.x, turret.y, TURRET_CONFIG.size / 2, 0, Math.PI * 2);
                ctx.fill();

                // Draw barrel
                ctx.save();
                ctx.translate(turret.x, turret.y);
                ctx.rotate(turret.angle);
                ctx.fillStyle = TURRET_CONFIG.barrelColor;
                ctx.fillRect(
                    TURRET_CONFIG.size / 4,
                    -TURRET_CONFIG.size / 8,
                    TURRET_CONFIG.barrelLength,
                    TURRET_CONFIG.size / 4
                );
                ctx.restore();

                // Draw range circle (debug)
                ctx.beginPath();
                ctx.arc(turret.x, turret.y, TURRET_CONFIG.range, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
                ctx.stroke();
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

        const getRandomEnemyType = () => {
            const types = ['normal', 'fast', 'tank'];
            return types[Math.floor(Math.random() * types.length)];
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