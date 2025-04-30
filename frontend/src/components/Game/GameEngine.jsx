import { useEffect, useState, useRef, useCallback } from "react";
import { PassiveSkills } from "../../systems/PassiveSkills";
import Player from "../../entities/Player";
import Enemy from "../../entities/Enemy";
import Drone from "../../entities/Drone";
import { TURRET_CONFIG, ENEMY_SPAWN_COUNT, ENEMY_SPAWN_INTERVAL, BASE_DAMAGE_INTERVAL, INITIAL_BASE_HEALTH, LINE_Y_OFFSET, weapons, ITEM_SPAWN_INTERVAL, ITEM_SPAWN_CHANCE, HAS_FAST_RELAOD, HAS_MOMENTUM, HAS_THORNS, HAS_LIFE_STEAL, HAS_RECOVERY } from "../../constansts/constants";
import calculateDistance from "../../utils/calculateDistance";
import { getRandomEnemyType } from "../../utils/getRandomEnemyType";
import { Item } from "../../entities/Item";
import { background_gameplay_1, background_gameplay_2, floor, fortress, tree_0, tree_1, tree_2 } from "../../assets";


const useGameEngine = (canvasRef, gameDuration, playerData, setPlayerData) => {
    const gunOffset = 24;
    const INITIAL_PLAYER_HEALTH = 100;

    // Game state
    const [win, setWin] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [baseHealth, setBaseHealth] = useState(INITIAL_BASE_HEALTH);
    const [score, setScore] = useState(0);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [enemyScalingFactor, setEnemyScalingFactor] = useState(2);
    const [currentEnemySpawnCount, setCurrentEnemySpawnCount] = useState(ENEMY_SPAWN_COUNT);

    // Player state
    const [playerHealth, setPlayerHealth] = useState(INITIAL_PLAYER_HEALTH);
    const [currentWeaponInfo, setCurrentWeaponInfo] = useState(weapons.pistol);
    const [currentAmmo, setCurrentAmmo] = useState(weapons.pistol.maxAmmo);
    const [isReloading, setIsReloading] = useState(false);
    const [reloadTime, setReloadTime] = useState(0);
    const [itemSpawnTimer, setItemSpawnTimer] = useState(0);
    const [spritesLoaded, setSpritesLoaded] = useState(false);
    const [passiveSkills, setPassiveSkills] = useState({
        recovery: true,
        lifeSteal: HAS_LIFE_STEAL,
        thorns: HAS_THORNS,
        momentum: HAS_MOMENTUM,
        fastReload: HAS_FAST_RELAOD
    });

    const [screenShake, setScreenShake] = useState({
        offsetX: 0,
        offsetY: 0,
        active: false,
        endTime: 0,
        intensity: 0
    });


    const [maxDrones, setMaxDrones] = useState(6);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [musicVolume, setMusicVolume] = useState(0.5); // Default volume (0-1)


    // Refs for game objects
    const lastConvertedScore = useRef(0);
    const currentTrackIndex = useRef(0);
    const audioRef = useRef(null);

    const playerRef = useRef(null);
    const playerSpriteRefs = {
        front_0: useRef(null),
        front_1: useRef(null),
        front_2: useRef(null),
        front_3: useRef(null),
        back_0: useRef(null),
        back_1: useRef(null),
        back_2: useRef(null),
        back_3: useRef(null),
    };

    const screenShakeRef = useRef({
        offsetX: 0,
        offsetY: 0,
        active: false,
        endTime: 0,
        intensity: 0,
        duration: 0
    });

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
        normal: Array(4).fill().map(() => ({ current: null })),
        fast: Array(4).fill().map(() => ({ current: null })),
        tank: Array(8).fill().map(() => ({ current: null }))
    });

    const mousePos = useRef({ x: 0, y: 0 });
    const keys = useRef({ w: false, a: false, s: false, d: false, spacebar: false });
    const mouseDown = useRef(false);
    const passiveSkillsRef = useRef(passiveSkills);
    const bottomSpriteImage = useRef(null);
    const backgroundImageRef = useRef(null);

    // Initialize player
    useEffect(() => {
        if (playerRef.current === null) {
            playerRef.current = new Player(window.innerWidth / 2, window.innerHeight / 2, INITIAL_PLAYER_HEALTH);
            setPlayerHealth(playerRef.current.getHealth());
            setCurrentWeaponInfo(playerRef.current.getCurrentWeaponInfo());
            setCurrentAmmo(playerRef.current.getCurrentAmmo());
        }
    }, []);

    useEffect(() => {
        const loadSprites = async () => {
            try {
                // Front sprites
                for (let i = 0; i < 4; i++) {
                    const img = new Image();
                    img.src = `src/assets/player_ref/front/player_front_${i}.png`;
                    img.onload = () => {
                        // console.log(`Successfully loaded front_${i}`, img);
                        playerSpriteRefs[`front_${i}`].current = img;
                        // Check if all sprites are loaded
                        const allLoaded = Object.values(playerSpriteRefs).every(ref => ref.current);
                        if (allLoaded) setSpritesLoaded(true);
                    };
                    img.onerror = () => console.error(`Failed to load front_${i} from ${img.src}`);

                }

                for (let i = 0; i < 4; i++) {
                    const img = new Image();
                    img.src = `src/assets/player_ref/back/player_back_${i}.png`;
                    img.onload = () => {
                        // console.log(`Successfully loaded back_${i}`, img);
                        playerSpriteRefs[`back_${i}`].current = img;
                        // Check if all sprites are loaded
                        const allLoaded = Object.values(playerSpriteRefs).every(ref => ref.current);
                        if (allLoaded) setSpritesLoaded(true);
                    };
                    img.onerror = () => console.error(`Failed to load back${i} from ${img.src}`);
                }
            } catch (error) {
                console.error('Error loading sprites:', error);
            }
        };
        loadSprites();
    }, []);

    // Preload enemy sprites
    useEffect(() => {
        const types = ['normal', 'fast', 'tank'];
        types.forEach(type => {
            for (let i = 0; i < 4; i++) {
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

    const cursorImage = new Image();
    cursorImage.src = 'src/assets/cursor.png'; 

    // Update the enemy kill reward to modify playerData directly:
    const handleEnemyKilled = useCallback((enemy) => {
        setScore(prev => {
            const newScore = prev + enemy.score;
            // Calculate currency based on total score, not just enemy.score
            const currencyToAdd = Math.floor(newScore / 2) - Math.floor(lastConvertedScore.current / 2);

            if (currencyToAdd > 0) {
                setPlayerData(prevData => ({
                    ...prevData,
                    currency: prevData.currency + currencyToAdd
                }));
                lastConvertedScore.current = newScore;
            }

            return newScore;
        });
    }, [setPlayerData]);

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

    const playBackgroundMusic = useCallback(() => {
        // Stop any existing music
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        const tracks = [background_gameplay_1, background_gameplay_2];
        currentTrackIndex.current = 0;

        const playTrack = () => {
            audioRef.current = new Audio(tracks[currentTrackIndex.current]);
            audioRef.current.volume = musicVolume;

            audioRef.current.play()
                .then(() => {
                    setIsMusicPlaying(true);
                })
                .catch(e => {
                    console.warn("Background music play failed:", e);
                    // Implement fallback or user notification if needed
                });

            // When current track ends, play the next one
            audioRef.current.addEventListener('ended', () => {
                currentTrackIndex.current = (currentTrackIndex.current + 1) % tracks.length;
                playTrack();
            });
        };

        playTrack();
    }, [musicVolume]);

    const toggleMusic = useCallback(() => {
        if (isMusicPlaying) {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            setIsMusicPlaying(false);
        } else {
            playBackgroundMusic();
        }
    }, [isMusicPlaying, playBackgroundMusic]);

    const setVolume = useCallback((volume) => {
        setMusicVolume(volume);
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, []);

    // Start music when game starts
    useEffect(() => {
        if (!win && !gameOver && !isPaused) {
            playBackgroundMusic();
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
                setIsMusicPlaying(false);
            }
        }
    }, [win, gameOver, isPaused, playBackgroundMusic]);

    // Clean up audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // item spawn timer
    useEffect(() => {
        if (win || gameOver || isPaused) return;

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
    }, [win, gameOver, isPaused, spawnItem]);

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

            if (distance < playerRadius + item.size / 2) {
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
        // Clear all enemy damage intervals first
        enemies.current.forEach(enemy => {
            if (enemy.damageInterval) {
                clearInterval(enemy.damageInterval);
                enemy.damageInterval = null;
            }
        });

        // Reset all state variables
        setWin(false);
        setGameOver(false);
        setBaseHealth(INITIAL_BASE_HEALTH);
        setScore(0);
        setTimeElapsed(0);
        setEnemyScalingFactor(1);
        setCurrentEnemySpawnCount(ENEMY_SPAWN_COUNT);
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
        lastConvertedScore.current = 0;
    }, [INITIAL_BASE_HEALTH]);

    const cleanupGame = useCallback(() => {
        handleRestart();
    }, [handleRestart]);

    // Input handlers
    const handleMouseMove = useCallback((e) => {
        mousePos.current = { x: e.clientX, y: e.clientY };
    }, []);

    const handleWeaponFire = useCallback(() => {
        if (isPaused) return; // Add this line
        const player = playerRef.current;
        if (!player) return;

        player.attemptFire(mousePos.current, createBulletsCallbackForPlayer);
        setCurrentAmmo(player.getCurrentAmmo());
        setIsReloading(player.isReloading());
        setReloadTime(player.getReloadTimeRemaining());
    }, [createBulletsCallbackForPlayer, isPaused]);

    const handleMouseDown = useCallback((e) => {
        if (isPaused) return; // Add this line
        mouseDown.current = true;
        const player = playerRef.current;
        if (player && !player.getCurrentWeaponInfo().isAutomatic) {
            handleWeaponFire();
        }
    }, [handleWeaponFire, isPaused]);

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
            case 'escape':
                setIsPaused(prev => !prev);
                break;
            case 'p':  // Add alternative pause/resume key
                setIsPaused(prev => !prev);
                break;
            default: break;
        }
    }, [handleWeaponSwitch]);

    const handleKeyUp = useCallback((e) => {
        const key = e.key.toLowerCase();
        if (keys.current.hasOwnProperty(key)) keys.current[key] = false;
    }, []);

    const applyScreenShake = useCallback((intensity = 5, duration = 200) => {
        const newShake = {
            offsetX: 0,
            offsetY: 0,
            active: true,
            endTime: Date.now() + duration,
            intensity,
            duration
        };
        screenShakeRef.current = newShake;
        setScreenShake(newShake);
    }, []);

    const updateScreenShake = useCallback(() => {
        const shake = screenShakeRef.current;

        if (!shake.active || Date.now() > shake.endTime) {
            if (shake.active) {
                const newShake = { ...shake, active: false, offsetX: 0, offsetY: 0 };
                screenShakeRef.current = newShake;
                setScreenShake(newShake);
            }
            return;
        }

        const timeRemaining = shake.endTime - Date.now();
        const progress = timeRemaining / shake.duration;
        const decay = progress;
        const intensity = shake.intensity * decay;

        // Update the ref immediately
        screenShakeRef.current.offsetX = (Math.random() * 2 - 1) * intensity * 2;
        screenShakeRef.current.offsetY = (Math.random() * 2 - 1) * intensity * 2;

        // Optionally update state less frequently for React components
        if (Date.now() % 3 === 0) { // Only update state every 3 frames
            setScreenShake({
                ...screenShakeRef.current,
                offsetX: screenShakeRef.current.offsetX,
                offsetY: screenShakeRef.current.offsetY
            });
        }
    }, []);

    useEffect(() => {
        const loadBackground = () => {
            backgroundImageRef.current = new Image();
            backgroundImageRef.current.src = floor;
            backgroundImageRef.current.onload = () => {
                // Image loaded, you might want to trigger a redraw
            };
            backgroundImageRef.current.onerror = () => {
                console.error('Failed to load background image');
            };
        };

        loadBackground();
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
        if (win || gameOver || isPaused) return;
        const timerInterval = setInterval(() => {
            setTimeElapsed(prev => prev + 1000);
        }, 1000);
        return () => clearInterval(timerInterval);
    }, [win, gameOver, isPaused]);

    // Add more enemies as the game progresses
    useEffect(() => {
        if (win || gameOver || isPaused) return;
        const maxEnemysSpawnCount = 20;
        const spawnCountInterval = setInterval(() => {
            setCurrentEnemySpawnCount(prev => Math.min(prev + 1, maxEnemysSpawnCount)); // Max of 20 enemies per wave
        }, 30000);
        return () => clearInterval(spawnCountInterval);
    }, [win, gameOver, isPaused]);


    // Make neemies harder to defeat
    useEffect(() => {
        if (win || gameOver || isPaused) return;
        const scalingInterval = setInterval(() => {
            setEnemyScalingFactor(prev => prev * 1.2);
        }, 30000);
        return () => clearInterval(scalingInterval);
    }, [win, gameOver, isPaused]);

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

            // Use currentEnemySpawnCount instead of ENEMY_SPAWN_COUNT
            for (let i = 0; i < currentEnemySpawnCount; i++) {
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

            // Update screen shake first
            updateScreenShake();
            const { offsetX, offsetY } = screenShakeRef.current;

            // Clear canvas
            ctx.clearRect(
                -Math.abs(offsetX),
                -Math.abs(offsetY),
                canvas.width + Math.abs(offsetX) * 2,
                canvas.height + Math.abs(offsetY) * 2
            );

            // Save context before applying transformations
            ctx.save();

            // Apply screen shake if active
            if (screenShakeRef.current.active) {
                ctx.translate(offsetX, offsetY);
            }
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.fillText(`Shake: X:${screenShake.offsetX.toFixed(1)} Y:${screenShake.offsetY.toFixed(1)}`, 500, 30);

            // Update and draw all game objects here...
            drawBackground();
            updatePlayer();
            updateEnemies();
            updateBullets();
            updateTurrets();
            updateDrones();
            updateItems();

            drawEnvironment();
            drawItems();
            drawPlayer();
            drawEnemies();
            drawBullets();
            drawDrones();
            drawTurrets();
            drawFortress();
            drawCursor();

            // Restore context
            ctx.restore();

            checkItemCollisions();

            animationFrameId = requestAnimationFrame(updateGame);
        };

        const updatePlayer = () => {
            const player = playerRef.current;
            if (!player || isPaused) return;

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
                        if (!enemy.damageInterval && baseHealth > 0 && !isPaused) {
                            enemy.damageInterval = setInterval(() => {
                                if (win || gameOver || isPaused || !enemies.current.includes(enemy)) {
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
                        // Trigger screen shake based on weapon type
                        const shakeIntensity =
                            bullet.weaponType === 'shotgun' ? 4 :
                                bullet.weaponType === 'pistol' ? 1.5 :
                                    bullet.weaponType === 'machinegun' ? 2 : 1;
                        applyScreenShake(shakeIntensity, 500);

                        const knockbackForce =
                            bullet.weaponType === 'shotgun' ? 14 :
                                bullet.weaponType === 'pistol' ? 3 :
                                    bullet.weaponType === 'machinegun' ? 2 :
                                        bullet.weaponType === 'turret' ? 1 : 0;

                        const angle = bullet.angle ?? Math.atan2(
                            bullet.y - (enemy.y + enemy.size / 2),
                            bullet.x - (enemy.x + enemy.size / 2)
                        );


                        const enemyKilledByThisHit = enemy.takeDamage(bullet.damage, knockbackForce, angle);

                        if (enemyKilledByThisHit) {
                            hitByBullet = true;
                            setScore(prev => prev + enemy.score);
                            handleEnemyKilled(enemy);
                            setPlayerCurrency(prev => prev + Math.floor(enemy.score / 2));

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

                // Set default turret position
                if (turret.y === null || turret.y === undefined)
                    turret.y = canvas.height - LINE_Y_OFFSET + 50;
                if (turret.x === null || turret.x === undefined)
                    turret.x = canvas.width - 150;

                // Find the closest enemy within range
                let closestEnemy = null;
                let closestDistance = Infinity;
                enemies.current.forEach(enemy => {
                    const distance = calculateDistance(turret.x, turret.y, enemy.x, enemy.y);
                    if (distance < TURRET_CONFIG.range && distance < closestDistance) {
                        closestDistance = distance;
                        closestEnemy = enemy;
                    }
                });

                // Target and shoot
                turret.targetEnemy = closestEnemy;
                if (turret.targetEnemy) {
                    // Aim directly at the enemy center
                    const dx = turret.targetEnemy.x - turret.x;
                    const dy = turret.targetEnemy.y - turret.y;
                    turret.angle = Math.atan2(dy, dx);

                    // Fire bullet
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

        const drawBackground = () => {
            if (!backgroundImageRef.current || !backgroundImageRef.current.complete) return;

            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');

            // Draw the background image to cover the entire canvas
            ctx.drawImage(
                backgroundImageRef.current,
                0, 0,                          // Source X, Y
                backgroundImageRef.current.width, backgroundImageRef.current.height, // Source width, height
                0, 0,                          // Destination X, Y
                canvas.width, canvas.height     // Destination width, height
            );
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

            // console.log("Current player weapon:", player.currentWeaponType);

            player.draw(ctx, mousePos.current, playerSpriteRefs);
        };

        const drawEnemies = () => {
            enemies.current.forEach(enemy => {
                enemy.draw(ctx);
            });
        };

        const drawCursor = () => {
            const player = playerRef.current;
            if (!player || !mousePos.current || !cursorImage.complete) return;
        
            const playerPos = player.getPosition();
            const angle = Math.atan2(mousePos.current.y - playerPos.y, mousePos.current.x - playerPos.x);
        
            const bulletSpawnX = playerPos.x + Math.cos(angle + Math.PI / 2) * gunOffset;
            const bulletSpawnY = playerPos.y + Math.sin(angle + Math.PI / 2) * gunOffset;
        
            const cursorX = mousePos.current.x + Math.cos(angle + Math.PI / 2) * gunOffset;
            const cursorY = mousePos.current.y + Math.sin(angle + Math.PI / 2) * gunOffset;
        
            ctx.save();
        
            // Draw offset correction line
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
        
            ctx.restore(); // End normal drawing context
        
            // Start cursor drawing with invert effect
            ctx.save();
            ctx.translate(cursorX, cursorY);
            ctx.globalCompositeOperation = "difference";
        
            const size = 32;
            ctx.drawImage(cursorImage, -size / 2, -size / 2, size, size);
        
            ctx.restore();
        };

        const drawBullets = () => {
            bullets.current.forEach(bullet => {
                ctx.save();
                ctx.translate(bullet.x, bullet.y);
                ctx.rotate(bullet.angle ?? 0);
                ctx.fillStyle =
                    bullet.weaponType === 'turret' ? '#233027' :
                        bullet.weaponType === 'shotgun' ? '#d2eb71' :
                            bullet.weaponType === 'pistol' ? '#523c2a' :
                                bullet.weaponType === 'machinegun' ? '#232624':
                                 '#FF0000';
                ctx.fillRect(-bullet.size / 2, -bullet.size / 2, bullet.size, bullet.size);
                ctx.restore();
            });
        };

        const drawTurrets = () => {
            const lineY = canvas.height - LINE_Y_OFFSET;
            turrets.current.forEach(turret => {
                if (!turret.y) turret.y = lineY + 50;

                const size = TURRET_CONFIG.size;
                const baseSize = size;
                const barrelWidth = size / 4;
                const barrelHeight = size / 4;
                const barrelLength = TURRET_CONFIG.barrelLength;
                const range = TURRET_CONFIG.range;

                ctx.save();
                ctx.imageSmoothingEnabled = false;

                const x = Math.floor(turret.x);
                const y = Math.floor(turret.y);

                // --- Range Radar Lines (Optional Retro Style) ---
                if (turret.isSelected || turret.targetEnemy) {
                    ctx.save();
                    ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
                    ctx.lineWidth = 1;

                    const steps = 16;
                    for (let i = 0; i < steps; i++) {
                        const angle = (i / steps) * Math.PI * 2;
                        const dx = Math.floor(x + Math.cos(angle) * range);
                        const dy = Math.floor(y + Math.sin(angle) * range);
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(dx, dy);
                        ctx.stroke();
                    }
                    ctx.restore();
                }

                // --- Base ---
                const baseX = x - baseSize / 2;
                const baseY = y - baseSize / 2;

                // Fill
                ctx.fillStyle = '#4b4b4b';
                ctx.fillRect(baseX, baseY, baseSize, baseSize);

                // Thick Outline
                ctx.lineWidth = 10;
                ctx.strokeStyle = '#1a1a1a';
                ctx.strokeRect(baseX - 1, baseY - 1, baseSize + 2, baseSize + 2); // Slight offset for better pixel effect

                // Base Highlights
                ctx.fillStyle = '#777';
                ctx.fillRect(baseX, baseY, baseSize, 2);
                ctx.fillRect(baseX, baseY, 2, baseSize);

                // --- Barrel ---
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(turret.angle);

                const barrelX = Math.floor(baseSize / 2);
                const barrelY = Math.floor(-barrelHeight / 2);

                // Shadow
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(barrelX + 1, barrelY + 1, barrelLength, barrelHeight);

                // Main Barrel
                ctx.fillStyle = '#797979';
                ctx.fillRect(barrelX, barrelY, barrelLength, barrelHeight);

                // Barrel Outline
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#111';
                ctx.strokeRect(barrelX - 1, barrelY - 1, barrelLength + 2, barrelHeight + 2);

                // Barrel Rings
                ctx.fillStyle = '#505050';
                for (let i = 6; i < barrelLength - 4; i += 8) {
                    ctx.fillRect(barrelX + i, barrelY, 2, barrelHeight);
                }

                // Muzzle Tip
                ctx.fillStyle = '#2b2b2b';
                ctx.fillRect(barrelX + barrelLength, barrelY, 4, barrelHeight);
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#000';
                ctx.strokeRect(barrelX + barrelLength - 1, barrelY - 1, 6, barrelHeight + 2);

                ctx.restore();

                // --- Targeting Line ---
                if (turret.targetEnemy) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(Math.floor(turret.targetEnemy.x), Math.floor(turret.targetEnemy.y));
                    ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                ctx.restore();
            });
        };

        const drawDrones = () => {
            drones.current.forEach(drone => drone.draw(ctx));
        };

        const drawEnvironment = () => {
            const lineY = canvas.height - LINE_Y_OFFSET;
            const spawnZoneWidth = canvas.width * 0.1;
            const playableWidth = canvas.width - (2 * spawnZoneWidth);

            // Draw spawn zones
            ctx.fillStyle = 'rgba(128, 128, 128, 0.2)';
            ctx.fillRect(0, 0, spawnZoneWidth, canvas.height);
            ctx.fillRect(canvas.width - spawnZoneWidth, 0, spawnZoneWidth, canvas.height);

            // Draw defense line
            ctx.beginPath();
            ctx.moveTo(0, lineY);
            ctx.lineTo(canvas.width, lineY);
            ctx.strokeStyle = 'grey';
            ctx.lineWidth = 4;
            ctx.stroke();
        };

        const drawFortress = () => {
            // Draw bottom sprite (full width, 120px height)
            const bottomSpriteHeight = 150;
            const bottomSpriteY = canvas.height - bottomSpriteHeight;

            // Create image if it doesn't exist
            if (!bottomSpriteImage.current) {
                bottomSpriteImage.current = new Image();
                bottomSpriteImage.current.src = fortress;
            }

            // Draw when image is loaded
            if (bottomSpriteImage.current.complete) {
                ctx.drawImage(
                    bottomSpriteImage.current,
                    0, bottomSpriteY,
                    canvas.width, bottomSpriteHeight
                );
            }
        }

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

            // Clear all enemy damage intervals
            enemies.current.forEach(enemy => {
                if (enemy.damageInterval) {
                    clearInterval(enemy.damageInterval);
                    enemy.damageInterval = null;
                }
            });

            if (isPaused) {

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
            }
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
        INITIAL_PLAYER_HEALTH,
        INITIAL_BASE_HEALTH,
        

        isMusicPlaying,
        musicVolume,

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
        handleWeaponSwitch,
        setIsPaused,
        cleanupGame,
        toggleMusic,
        setVolume,
        applyScreenShake
    };
};

export default useGameEngine;