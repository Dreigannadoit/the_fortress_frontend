import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Enemy } from './entities/enemy';
import { explosiveWeapons, weapons } from './constants';
import { playerSprite } from '../assets';

// --- Constants ---

const PLAYER_RADIUS = 20;
const PLAYER_SPEED = 5;
const RECOIL_DECAY = 0.9;
const ENEMY_SPAWN_COUNT = 1;
const ENEMY_SPAWN_INTERVAL = 1000;
const BASE_DAMAGE_INTERVAL = 15000;
const LINE_Y_OFFSET = 120;
const PLAYER_SPRITE_WIDTH = 70;
const PLAYER_SPRITE_HEIGHT = 70;
const PLAYER_SPRITE_SCALE = 1;

const TURRET_CONFIG = {
    fireRate: 100, // ms between shots
    range: 600,     // pixels
    damage: 75,
    bulletSpeed: 15,
    size: 70,       // Turret base size
    color: "#4A4A4A",
    barrelColor: "#2C2C2C",
    barrelLength: 25,
    bulletSize: 10,
};

// --- Helper Functions ---
const calculateDistance = (x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
};

const getRandomEnemyType = () => {
    const spawnRates = {
        normal: 0.33,
        fast: 0.33,
        tank: 0.33,
    };

    const random = Math.random();
    let cumulative = 0;

    for (const type in spawnRates) {
        cumulative += spawnRates[type];
        if (random < cumulative) {
            return type;
        }
    }
    return 'normal'; // Default to normal if something goes wrong
};

const useCanvas = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);

    return canvasRef;
};

const useImage = (imageSrc) => {
    const imageRef = useRef(null);

    useEffect(() => {
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
            imageRef.current = img;
        };
    }, [imageSrc]);

    return imageRef;
};

const GameScene = () => {
    const canvasRef = useCanvas();
    const playerImageRef = useImage(playerSprite);

    // --- State Variables ---
    const [win, setWin] = useState();
    const [gameOver, setGameOver] = useState();
    const [currentWeapon, setCurrentWeapon] = useState(weapons.pistol);
    const [currentAmmo, setCurrentAmmo] = useState(weapons.pistol.maxAmmo);
    const [isReloading, setIsReloading] = useState(false);
    const [reloadTime, setReloadTime] = useState(0);
    const [playerHealth, setPlayerHealth] = useState(100);
    const [baseHealth, setBaseHealth] = useState(200);
    const [score, setScore] = useState(0); // Add score state
    const [timeElapsed, setTimeElapsed] = useState(0);
    const gameDuration = 120000; // 2 minutes in milliseconds

    // --- Ref Variables ---
    const player = useRef({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        radius: PLAYER_RADIUS,
        speed: PLAYER_SPEED,
        velocity: { x: 0, y: 0 },
        recoilVelocity: { x: 0, y: 0 },
        health: playerHealth,
        maxHealth: 100,
        currentWeapon: {
            ...weapons.pistol,
            currentAmmo: weapons.pistol.maxAmmo,
            lastFireTime: 0,
            isReloading: false,
            lastReloadTime: 0,
        },
        explosives: Object.keys(explosiveWeapons).reduce((acc, key) => {
            acc[key] = explosiveWeapons[key].maxCarry;
            return acc;
        }, {}),
    });

    const turrets = useRef([
        { // Left turret
            x: 50,
            y: null, // Will be set later
            angle: 0,
            targetEnemy: null,
            lastFireTime: 0
        },
        { // Right turret
            x: null, // Will be set later
            y: null,
            angle: 0,
            targetEnemy: null,
            lastFireTime: 0
        }
    ]);

    const bullets = useRef([]);
    const enemies = useRef([]);
    const mousePos = useRef({ x: 0, y: 0 });
    const keys = useRef({ w: false, a: false, s: false, d: false, spacebar: false });
    const mouseDown = useRef(false);

    // --- Bullet Creation ---
    const createBullet = useCallback((x, y, size, bulletSpeed, angle, range, damage, weaponType) => ({
        x,
        y,
        size,
        velocity: {
            x: Math.cos(angle) * bulletSpeed,
            y: Math.sin(angle) * bulletSpeed,
        },
        startX: x,
        startY: y,
        maxDistance: range,
        damage,
        angle,
        weaponType,
    }), []);

    const createBullets = useCallback((p, weapon, mousePosition) => {
        const angle = Math.atan2(mousePosition.y - p.y, mousePosition.x - p.x);
        const gunOffset = 15;
        const bulletX = p.x + Math.cos(angle + Math.PI / 2) * gunOffset;
        const bulletY = p.y + Math.sin(angle + Math.PI / 2) * gunOffset;

        if (weapon.name === 'shotgun') {
            const spread = weapon.spread;
            const pelletAngles = Array.from({ length: weapon.pellets }, (_, i) => {
                return angle - spread / 2 + (i * spread) / (weapon.pellets - 1);
            });

            pelletAngles.forEach(pelletAngle => {
                bullets.current.push(createBullet(
                    bulletX, bulletY,
                    weapon.bulletSize,
                    weapon.bulletSpeed,
                    pelletAngle,
                    weapon.range,
                    weapon.damage,
                    weapon.name
                ));
            });
        } else {
            bullets.current.push(createBullet(
                bulletX, bulletY,
                weapon.bulletSize,
                weapon.bulletSpeed,
                angle,
                weapon.range,
                weapon.damage,
                weapon.name
            ));
        }
    }, [createBullet]);

    // --- Game Logic Handlers ---
    const handleMouseMove = useCallback((e) => {
        mousePos.current = { x: e.clientX, y: e.clientY };
    }, []);

    const startReload = useCallback((weapon) => {
        weapon.isReloading = true;
        weapon.lastReloadTime = Date.now();
        setIsReloading(true);
    }, []);

    const handleMouseUp = useCallback(() => {
        mouseDown.current = false;
    }, []);

    const applyRecoil = useCallback((p, weaponName, angle) => {
        let recoilForce = 0;

        switch (weaponName) {
            case "pistol":
                recoilForce = 0.5;
                break;
            case "shotgun":
                recoilForce = 15;
                break;
            case "machinegun":
                recoilForce = 3;
                break;
            default:
                return;
        }

        p.recoilVelocity.x -= Math.cos(angle) * recoilForce;
        p.recoilVelocity.y -= Math.sin(angle) * recoilForce;
    }, []);

    const handleWeaponFire = useCallback(() => {
        const p = player.current;
        const weapon = p.currentWeapon;
        const now = Date.now();

        if (!weapon.unlocked || weapon.isReloading) return;
        if (now - weapon.lastFireTime < weapon.fireRate) return;
        if (weapon.currentAmmo <= 0) {
            startReload(weapon);
            return;
        }

        const angle = Math.atan2(mousePos.current.y - p.y, mousePos.current.x - p.x);
        applyRecoil(p, weapon.name, angle);

        weapon.currentAmmo--;
        setCurrentAmmo(weapon.currentAmmo);
        createBullets(p, weapon, mousePos.current);
        weapon.lastFireTime = now;
        setReloadTime(weapon.fireRate);

        if (weapon.currentAmmo <= 0) {
            startReload(weapon);
        }
    }, [createBullets, startReload, applyRecoil]);

    // --- Mouse Handlers ---
    const handleMouseDown = useCallback((e) => {
        mouseDown.current = true;
        if (!player.current.currentWeapon.isAutomatic) {
            handleWeaponFire();
        }
    }, [handleWeaponFire]);

    // In handleWeaponSwitch
    const handleWeaponSwitch = useCallback((weaponName) => {
        const newWeapon = {
            ...weapons[weaponName],
            currentAmmo: weapons[weaponName].maxAmmo, // Always reset ammo
            isReloading: false,
            lastFireTime: 0,
        };
        player.current.currentWeapon = newWeapon;
        setCurrentWeapon(newWeapon);
        setCurrentAmmo(newWeapon.currentAmmo);
        setIsReloading(false);
    }, []);


    const handleKeyDown = useCallback((e) => {
        const key = e.key.toLowerCase();
        if (keys.current.hasOwnProperty(key)) keys.current[key] = true;

        switch (key) {
            case '1':
                handleWeaponSwitch('pistol');
                break;
            case '2':
                handleWeaponSwitch('shotgun');
                break;
            case '3':
                handleWeaponSwitch('machinegun');
                break;
            default:
                break;
        }
    }, [handleWeaponSwitch]);

    const handleKeyUp = useCallback((e) => {
        const key = e.key.toLowerCase();
        if (keys.current.hasOwnProperty(key)) keys.current[key] = false;
    }, []);

    const handleRestart = () => {
        // Reset state
        setWin(false);
        setGameOver(false);
        setPlayerHealth(100);
        setBaseHealth(200);
        setScore(0);
        setTimeElapsed(0);
        setCurrentWeapon(weapons.pistol);
        setCurrentAmmo(weapons.pistol.maxAmmo);
        setIsReloading(false);
        setReloadTime(0);

        // Reset refs
        player.current = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            radius: PLAYER_RADIUS,
            speed: PLAYER_SPEED,
            velocity: { x: 0, y: 0 },
            recoilVelocity: { x: 0, y: 0 },
            health: 100,
            maxHealth: 100,
            currentWeapon: {
                ...weapons.pistol,
                currentAmmo: weapons.pistol.maxAmmo,
                lastFireTime: 0,
                isReloading: false,
                lastReloadTime: 0,
            },
            explosives: Object.keys(explosiveWeapons).reduce((acc, key) => {
                acc[key] = explosiveWeapons[key].maxCarry;
                return acc;
            }, {}),
        };
        turrets.current = [
            { x: 50, y: null, angle: 0, targetEnemy: null, lastFireTime: 0 },
            { x: null, y: null, angle: 0, targetEnemy: null, lastFireTime: 0 }
        ];
        bullets.current = [];
        enemies.current = [];
    };

    // Add these effects for game state management
    useEffect(() => {
        if (timeElapsed >= gameDuration) {
            setWin(true);
        }
    }, [timeElapsed]);

    useEffect(() => {
        if (playerHealth <= 0 || baseHealth <= 0) {
            setGameOver(true);
        }
    }, [playerHealth, baseHealth]);


    // Timer interval
    useEffect(() => {
        if (win || gameOver) return;

        const timerInterval = setInterval(() => {
            setTimeElapsed(prev => prev + 1000);
        }, 1000);

        return () => clearInterval(timerInterval);
    }, [win, gameOver]);

    // --- Game Loop ---
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // --- Event Listeners ---
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // --- Enemy Spawning ---
        const spawnEnemy = () => {
            if (win || gameOver) return;
            for (let i = 0; i < ENEMY_SPAWN_COUNT; i++) {
                const type = getRandomEnemyType();
                const y = -10;

                // Use canvas dimensions for calculation
                const canvas = canvasRef.current;
                const spawnZoneWidth = canvas.width * 0.1;
                const minX = spawnZoneWidth;
                const maxX = canvas.width - (spawnZoneWidth + 0.15);

                const x = Math.random() * (maxX - minX) + minX;

                enemies.current.push(new Enemy(x, y, type));
            }
        };

        const enemySpawnInterval = setInterval(spawnEnemy, ENEMY_SPAWN_INTERVAL);

        // --- Animation Loop ---
        const animate = () => {
            if (!canvas) return;

            if (win || gameOver) {
                requestAnimationFrame(animate);
                return;
            }
            // if (!canvas || win || gameOver) return;
            const p = player.current;
            const weapon = p.currentWeapon;
            const now = Date.now();

            // Automatic weapon firing
            if (weapon.isAutomatic && mouseDown.current && !weapon.isReloading) {
                if (now - weapon.lastFireTime >= weapon.fireRate) {
                    if (weapon.currentAmmo > 0) {
                        handleWeaponFire();
                    } else {
                        startReload(weapon);
                    }
                }
            }

            // Handle reloading
            if (weapon.isReloading) {
                const reloadProgress = now - weapon.lastReloadTime;
                if (reloadProgress >= weapon.reloadDuration) {
                    weapon.isReloading = false;
                    weapon.currentAmmo = weapon.maxAmmo;
                    setCurrentAmmo(weapon.maxAmmo);
                    setIsReloading(false);
                    setReloadTime(0);
                } else {
                    setReloadTime(weapon.reloadDuration - reloadProgress);
                }
            }

            // Player movement
            const moveSpeed = p.speed;
            const moveVelocity = { x: 0, y: 0 };
            if (keys.current.w) moveVelocity.y -= moveSpeed;
            if (keys.current.s) moveVelocity.y += moveSpeed;
            if (keys.current.a) moveVelocity.x -= moveSpeed;
            if (keys.current.d) moveVelocity.x += moveSpeed;

            // Apply recoil velocity decay
            p.recoilVelocity.x *= RECOIL_DECAY;
            p.recoilVelocity.y *= RECOIL_DECAY;

            // Combine movement and recoil velocities
            p.x += moveVelocity.x + p.recoilVelocity.x;
            p.y += moveVelocity.y + p.recoilVelocity.y;

            // Keep within bounds
            p.x = Math.max(p.radius, Math.min(canvas.width - p.radius, p.x));
            p.y = Math.max(p.radius, Math.min(canvas.height - p.radius, p.y));

            turrets.current.forEach(turret => {
                // Find nearest enemy in range
                let closestEnemy = null;
                let closestDistance = Infinity;

                enemies.current.forEach(enemy => {
                    const dx = enemy.x - turret.x;
                    const dy = enemy.y - turret.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < TURRET_CONFIG.range && distance < closestDistance) {
                        closestDistance = distance;
                        closestEnemy = enemy;
                    }
                });

                // Update target
                turret.targetEnemy = closestEnemy;

                if (turret.targetEnemy) {
                    // Calculate angle to target
                    const angle = Math.atan2(
                        turret.targetEnemy.y - turret.y,
                        turret.targetEnemy.x - turret.x
                    );
                    turret.angle = angle;

                    // Fire if ready
                    if (Date.now() - turret.lastFireTime > TURRET_CONFIG.fireRate) {
                        bullets.current.push({
                            x: turret.x + Math.cos(angle) * TURRET_CONFIG.barrelLength,
                            y: turret.y + Math.sin(angle) * TURRET_CONFIG.barrelLength,
                            size: TURRET_CONFIG.bulletSize,
                            velocity: {
                                x: Math.cos(angle) * TURRET_CONFIG.bulletSpeed,
                                y: Math.sin(angle) * TURRET_CONFIG.bulletSpeed
                            },
                            damage: TURRET_CONFIG.damage,
                            weaponType: 'turret'
                        });

                        turret.lastFireTime = Date.now();
                    }
                }
            });

            // --- Drawing ---
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Calculate rotation angle towards mouse
            const angle = Math.atan2(mousePos.current.y - p.y, mousePos.current.x - p.x);

            // Draw player sprite with rotation
            if (playerImageRef.current) {
                const drawWidth = PLAYER_SPRITE_WIDTH * PLAYER_SPRITE_SCALE;
                const drawHeight = PLAYER_SPRITE_HEIGHT * PLAYER_SPRITE_SCALE;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(angle + Math.PI / 2);

                ctx.drawImage(
                    playerImageRef.current,
                    -drawWidth / 2,
                    -drawHeight / 2,
                    drawWidth,
                    drawHeight
                );

                ctx.restore();
            }

            // Draw Gun Direction (DEBUG)
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + Math.cos(angle) * 30, p.y + Math.sin(angle) * 30);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0)';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Update and Draw Bullets
            bullets.current.forEach((bullet, index) => {
                bullet.x += bullet.velocity.x;
                bullet.y += bullet.velocity.y;

                const distance = calculateDistance(bullet.x, bullet.y, bullet.startX, bullet.startY);

                if (distance >= bullet.maxDistance ||
                    bullet.x < 0 || bullet.x > canvas.width ||
                    bullet.y < 0 || bullet.y > canvas.height) {
                    bullets.current.splice(index, 1);
                    return;
                }

                ctx.save();
                ctx.translate(bullet.x, bullet.y);
                ctx.rotate(bullet.angle);
                ctx.fillStyle = 'red';
                ctx.fillRect(-bullet.size / 2, -bullet.size / 2, bullet.size, bullet.size);
                ctx.restore();
            });

            // Reduce fire rate timer
            if (!weapon.isReloading && reloadTime > 0) {
                setReloadTime(prev => Math.max(0, prev - 16));
            }

            const lineY = canvas.height - LINE_Y_OFFSET;

            // Initialize turret positions
            turrets.current.forEach(turret => {
                if (!turret.y) {
                    turret.y = lineY + 50; // Position below blue line
                }
                if (turret.x === null) {
                    turret.x = canvas.width - 50; // Right edge
                }
            });

            // Inside animate(), before drawing enemies
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

                // Draw range circle (optional)
                ctx.beginPath();
                ctx.arc(turret.x, turret.y, TURRET_CONFIG.range, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
                ctx.stroke();
            });

            // Move and Draw Enemies
            enemies.current.forEach((enemy, index) => {
                enemy.x += enemy.velocity.x;
                enemy.y += enemy.velocity.y;
                enemy.velocity.x *= 0.9;
                enemy.velocity.y *= 0.9;

                const maxY = lineY - enemy.size;  // Move this to top so all enemy types use it

                if (enemy.type === 'fast') {
                    const distance = calculateDistance(player.current.x, player.current.y, enemy.x, enemy.y);

                    if (distance > 0) {
                        enemy.x += ((player.current.x - enemy.x) / distance) * enemy.speed;
                        enemy.y += ((player.current.y - enemy.y) / distance) * enemy.speed;
                    }
                    // Fast enemies can move vertically but respect maxY
                    if (enemy.y > maxY) {
                        enemy.y = maxY;
                        enemy.velocity.y = 0;
                    }
                } else {
                    // Reset isStopped if enemy gets knocked above the line
                    if (enemy.y < maxY) {
                        enemy.isStopped = false;
                    }

                    // Only move downward if not stopped
                    if (!enemy.isStopped) {
                        enemy.y += enemy.speed;
                    }

                    // Clamp position to maxY
                    if (enemy.y > maxY) {
                        enemy.y = maxY;
                        enemy.isStopped = true;

                        if (!enemy.damageInterval) {
                            enemy.damageInterval = setInterval(() => {
                                setBaseHealth(prev => Math.max(0, prev - enemy.damage));
                            }, BASE_DAMAGE_INTERVAL);
                        }
                    }
                }

                enemy.x = Math.max(0, Math.min(canvas.width - enemy.size, enemy.x));

                let color;
                switch (enemy.type) {
                    case 'fast':
                        color = '#00ffff';
                        break;
                    case 'tank':
                        color = '#006400';
                        break;
                    default:
                        color = 'red';
                }

                ctx.fillStyle = color;
                ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);

                // Draw Health Bar
                ctx.fillStyle = "black";
                ctx.fillRect(enemy.x, enemy.y - 10, enemy.size, 5);
                ctx.fillStyle = "green";
                ctx.fillRect(enemy.x, enemy.y - 10, (enemy.health / enemy.maxHealth) * enemy.size, 5);

                // Check if any bullet hits the enemy
                bullets.current.forEach((bullet, bIndex) => {
                    if (bullet.weaponType === 'turret') {
                        // Turret bullet collision check
                        const bulletCenter = {
                            x: bullet.x + bullet.size / 2,
                            y: bullet.y + bullet.size / 2
                        };

                        if (
                            bulletCenter.x > enemy.x &&
                            bulletCenter.x < enemy.x + enemy.size &&
                            bulletCenter.y > enemy.y &&
                            bulletCenter.y < enemy.y + enemy.size
                        ) {
                            const isKilled = enemy.takeDamage(bullet.damage, 0, 0);
                            bullets.current.splice(bIndex, 1);
                            if (isKilled) {
                                setScore(prev => prev + enemy.score); // Add score for turret kill
                            }
                        }
                    } else if (
                        bullet.x > enemy.x &&
                        bullet.x < enemy.x + enemy.size &&
                        bullet.y > enemy.y &&
                        bullet.y < enemy.y + enemy.size
                    ) {
                        const isShotgunPellet = bullet.weaponType === 'shotgun';
                        const knockbackForce = isShotgunPellet ? 8 : 0;
                        const angle = bullet.angle;

                        if (enemy.takeDamage(bullet.damage, knockbackForce, angle)) {
                            enemies.current.splice(index, 1);
                            setScore(prev => prev + enemy.score); // Add score for player bullet kill
                        }
                        bullets.current.splice(bIndex, 1);
                    }
                });

                // Collision with player
                const distance = calculateDistance(enemy.x, enemy.y, player.current.x, player.current.y);

                if (distance < player.current.radius + enemy.size) {
                    setPlayerHealth(prev => Math.max(0, prev - enemy.damage));
                    enemy.health -= 1;
                }
                if (enemy.isStopped) {
                    const now = Date.now();
                    if (!enemy.lastDamageTime || now - enemy.lastDamageTime >= BASE_DAMAGE_INTERVAL) {
                        setBaseHealth(prev => Math.max(0, prev - enemy.damage));
                        enemy.lastDamageTime = now;
                    }
                }
                if (enemy.health <= 0) {
                    clearInterval(enemy.damageInterval);
                    enemies.current = enemies.current.filter(e => e !== enemy);
                    setScore(prev => prev + enemy.score); // Add score for other kill cases
                    console.log("enemy killed");
                }
            });

            // Add burning effect to enemies
            enemies.current.forEach(enemy => {
                if (enemy.isBurning) {
                    const burnDuration = Date.now() - enemy.burnStart;
                    if (burnDuration > throwableWeapons.molotov.burnDuration) {
                        enemy.isBurning = false;
                        delete enemy.burnStart;
                    } else {
                        // Draw burning effect
                        ctx.fillStyle = `rgba(255, ${Math.random() * 100}, 0, 0.5)`;
                        ctx.beginPath();
                        ctx.arc(enemy.x + enemy.size / 2, enemy.y - 10, 5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            });

            // Draw spawn zones using canvas dimensions
            ctx.fillStyle = 'rgba(128, 128, 128, 0.2)';
            const spawnZoneWidth = canvas.width * 0.1;
            ctx.fillRect(0, 0, spawnZoneWidth, canvas.height); // Left
            ctx.fillRect(canvas.width - spawnZoneWidth, 0, spawnZoneWidth, canvas.height);

            // Draw blue line
            ctx.beginPath();
            ctx.moveTo(0, lineY);
            ctx.lineTo(canvas.width, lineY);
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 4;
            ctx.stroke();

            requestAnimationFrame(animate);
        };

        animate();

        // --- Cleanup ---
        return () => {
            clearInterval(enemySpawnInterval);
            window.removeEventListener('resize', () => { }); // Remove empty listener
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [canvasRef, handleKeyDown, handleKeyUp, handleMouseDown, handleMouseMove, handleMouseUp, createBullet, createBullets, startReload, applyRecoil]);

    useEffect(() => {
        return () => {
            enemies.current.forEach(enemy => {
                if (enemy.damageInterval) {
                    clearInterval(enemy.damageInterval);
                }
            });
        };
    }, []);

    return (
        <>
            {win && <YouWin score={score} onRestart={handleRestart} />}
            {gameOver && <GameOver onRestart={handleRestart} />}
            <canvas ref={canvasRef} style={{ display: 'block' }} />
            <WeaponDisplay
                currentWeapon={currentWeapon}
                currentAmmo={currentAmmo}
                isReloading={isReloading}
                reloadTime={reloadTime}
                playerHealth={playerHealth}
                baseHealth={baseHealth}
                score={score}
                timeElapsed={timeElapsed}
                gameDuration={gameDuration}
            />
        </>
    );
};

const GameOver = ({ onRestart }) => {
    return (
        <div className="screen game_over">
            <h1>Game Over</h1>
            <button onClick={onRestart}>Play Again</button>
        </div>
    );
}

const YouWin = ({ score, onRestart }) => {
    return (
        <div className="screen you_win">
            <h1>Mission Accomplished!</h1>
            <p>Final Score: {score}</p>
            <button onClick={onRestart}>Play Again</button>
        </div>
    );
}


const WeaponDisplay = ({ 
    currentWeapon, 
    currentAmmo, 
    isReloading, 
    reloadTime, 
    playerHealth, 
    baseHealth, 
    score,
    timeElapsed,
    gameDuration 
}) => {
    const timeLeft = Math.max(0, gameDuration - timeElapsed);
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);

    return (
        <div className="weapon_display">
            <div>Score: {score}</div>
            <div>Time Remaining: {minutes}:{seconds.toString().padStart(2, '0')}</div>
            <div className="key"
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: "10px"
                }}>
                <p className={`${currentWeapon.name === 'pistol' ? "active" : ""}`}>1</p>
                <p className={`${currentWeapon.name === 'shotgun' ? "active" : ""}`}>2</p>
                <p className={`${currentWeapon.name === 'machinegun' ? "active" : ""}`}>3</p>
            </div>
            <h3>Weapon: {currentWeapon.name}</h3>
            <p>Ammo: {currentAmmo} / {currentWeapon.maxAmmo}</p>
            <p>{isReloading ? `Reloading... ${Math.ceil(reloadTime)}mas` : "Ready to fire"}</p>
            <p>Player Health: {playerHealth}</p>
            <p>Base Health: {baseHealth}</p>
        </div>
    );
};

export default GameScene;