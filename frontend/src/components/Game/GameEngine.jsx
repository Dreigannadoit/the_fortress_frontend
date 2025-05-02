import { useEffect, useState, useRef, useCallback } from "react";
import { PassiveSkills } from "../../systems/PassiveSkills";
import Player from "../../entities/Player";
import Enemy from "../../entities/Enemy";
import Drone from "../../entities/Drone";
import { TURRET_CONFIG, ENEMY_SPAWN_COUNT, ENEMY_SPAWN_INTERVAL, BASE_DAMAGE_INTERVAL, INITIAL_BASE_HEALTH, LINE_Y_OFFSET, weapons as weaponDefinitions, ITEM_SPAWN_INTERVAL, ITEM_SPAWN_CHANCE } from "../../constansts/constants"; // Renamed weapons import
import calculateDistance from "../../utils/calculateDistance";
import { getRandomEnemyType } from "../../utils/getRandomEnemyType";
import { Item } from "../../entities/Item";
import { background_gameplay_1, background_gameplay_2, floor, fortress } from "../../assets";

const DEFAULT_PLAYER_HEALTH = 100;
const DEFAULT_CURRENCY = 0;
const DEFAULT_LEVEL = 1.0;
const DEFAULT_KILLS = 0;
const DEFAULT_WEAPON = 'pistol';

const useGameEngine = (
    canvasRef,
    gameDuration,
    initialPlayerData, // Data fetched from API via App.js
    setActiveSkillsAndRefresh
) => {
    const gunOffset = 24;
    const originalInitialData = useRef(initialPlayerData);

    // Game state
    const [win, setWin] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [baseHealth, setBaseHealth] = useState(INITIAL_BASE_HEALTH);
    const [score, setScore] = useState(0); // Represents kills during the current game session
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [enemyScalingFactor, setEnemyScalingFactor] = useState(1); // Start scaling later
    const [currentEnemySpawnCount, setCurrentEnemySpawnCount] = useState(ENEMY_SPAWN_COUNT);

    // --- Player State (Managed Internally during game) ---
    const [playerHealth, setPlayerHealth] = useState(DEFAULT_PLAYER_HEALTH);
    const [currentWeaponInfo, setCurrentWeaponInfo] = useState(weaponDefinitions[DEFAULT_WEAPON]);
    const [currentAmmo, setCurrentAmmo] = useState(weaponDefinitions[DEFAULT_WEAPON]?.maxAmmo || 15);
    const [isReloading, setIsReloading] = useState(false);
    const [reloadTime, setReloadTime] = useState(0);
    const [currentCurrencyInGame, setCurrentCurrencyInGame] = useState(DEFAULT_CURRENCY);
    const [currentLevelInGame, setCurrentLevelInGame] = useState(DEFAULT_LEVEL);

    // --- Active Skills (Reflects API state, managed via toggleSkill) ---
    const [passiveSkills, setPassiveSkills] = useState({}); // Initialized from initialPlayerData later

    // --- Other State ---
    const [itemSpawnTimer, setItemSpawnTimer] = useState(0);
    const [spritesLoaded, setSpritesLoaded] = useState(false);
    const [screenShake, setScreenShake] = useState({ offsetX: 0, offsetY: 0, active: false, endTime: 0, intensity: 0 });
    const [maxDrones, setMaxDrones] = useState(4);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [musicVolume, setMusicVolume] = useState(0.5);

    // --- Refs ---
    const playerRef = useRef(null);
    const lastConvertedScoreCurrency = useRef(0); // Tracks score conversion point for currency
    const currentTrackIndex = useRef(0);
    const audioRef = useRef(null);
    const playerSpriteRefs = { // Use direct refs
        front_0: useRef(null), front_1: useRef(null), front_2: useRef(null), front_3: useRef(null),
        back_0: useRef(null), back_1: useRef(null), back_2: useRef(null), back_3: useRef(null),
    };
    const screenShakeRef = useRef({ offsetX: 0, offsetY: 0, active: false, endTime: 0, intensity: 0, duration: 0 });
    const drones = useRef([]);
    const turrets = useRef([ // TODO: Initialize based on owned turrets? Or are they placed in-game?
        { x: 150, y: null, angle: 0, targetEnemy: null, lastFireTime: 0 },
        { x: null, y: null, angle: 0, targetEnemy: null, lastFireTime: 0 }
    ]);
    const bullets = useRef([]);
    const enemies = useRef([]);
    const items = useRef([]);
    const enemySpriteRefs = useRef({
        normal: Array(4).fill().map(() => ({ current: null })),
        fast: Array(4).fill().map(() => ({ current: null })),
        tank: Array(8).fill().map(() => ({ current: null }))
    });
    const mousePos = useRef({ x: 0, y: 0 });
    const keys = useRef({ w: false, a: false, s: false, d: false, spacebar: false });
    const mouseDown = useRef(false);
    const passiveSkillsRef = useRef(passiveSkills); // Ref for use inside callbacks without dependency issues
    const bottomSpriteImage = useRef(null);
    const backgroundImageRef = useRef(null);
    const cursorImageRef = useRef(null);
    // --- Initialize Engine State from initialPlayerData ---

    useEffect(() => {
        // Store the *first* set of data received for resets
        if (!originalInitialData.current && initialPlayerData) {
            originalInitialData.current = JSON.parse(JSON.stringify(initialPlayerData)); // Deep copy
        }

        if (initialPlayerData) {
            console.log("Initializing engine with Player Data:", initialPlayerData);
            setCurrentCurrencyInGame(initialPlayerData.currency ?? DEFAULT_CURRENCY);
            setCurrentLevelInGame(initialPlayerData.level ?? DEFAULT_LEVEL);

            // Initialize player health (usually full at start of game instance)
            setPlayerHealth(DEFAULT_PLAYER_HEALTH);

            // Map activeSkillIds array to the boolean object format used by the engine
            const activeSkillsMap = {};
            Object.keys(PassiveSkills).forEach(key => { // Assuming PassiveSkills keys match item IDs
                activeSkillsMap[key] = initialPlayerData.activeSkills?.includes(key) ?? false;
            });
            setPassiveSkills(activeSkillsMap);
            passiveSkillsRef.current = activeSkillsMap; // Update ref immediately

            // Set initial weapon in the player instance and update UI state
            const initialWeaponName = initialPlayerData.currentWeapon || DEFAULT_WEAPON;
            // Ensure weaponDefinitions has the weapon
            if (weaponDefinitions[initialWeaponName]) {
                if (playerRef.current) {
                    // Only switch if the weapon is different or player just initialized
                    if (playerRef.current.getCurrentWeaponInfo().name !== initialWeaponName) {
                        playerRef.current.switchWeapon(initialWeaponName);
                    }
                }
                // Update engine's view of the weapon
                const weaponInfo = weaponDefinitions[initialWeaponName];
                setCurrentWeaponInfo({ ...weaponInfo }); // Use copy
                setCurrentAmmo(weaponInfo.maxAmmo);
                setIsReloading(false);
                setReloadTime(0);
            } else {
                console.warn(`Initial weapon "${initialWeaponName}" not found in definitions. Defaulting to pistol.`);
                if (playerRef.current && playerRef.current.getCurrentWeaponInfo().name !== DEFAULT_WEAPON) {
                    playerRef.current.switchWeapon(DEFAULT_WEAPON);
                }
                const defaultWeaponInfo = weaponDefinitions[DEFAULT_WEAPON];
                setCurrentWeaponInfo({ ...defaultWeaponInfo });
                setCurrentAmmo(defaultWeaponInfo.maxAmmo);
            }

            // Initialize player ref *after* setting initial weapon info potentially
            if (!playerRef.current) {
                playerRef.current = new Player(
                    window.innerWidth / 2,
                    window.innerHeight / 2,
                    DEFAULT_PLAYER_HEALTH // Start game with full health
                );
                // Switch to the correct initial weapon if player was just created
                playerRef.current.switchWeapon(initialWeaponName);
            }


        } else {
            console.log("Waiting for initial player data...");
            // Handle state if initialPlayerData is null (e.g., show loading in Game component)
        }

    }, [initialPlayerData]);

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

    useEffect(() => {
        cursorImageRef.current = new Image();
        cursorImageRef.current.src = 'src/assets/cursor.png';
        cursorImageRef.current.onerror = () => console.error("Failed to load cursor image");
    }, []);
    useEffect(() => {
        backgroundImageRef.current = new Image();
        backgroundImageRef.current.src = floor;
        backgroundImageRef.current.onerror = () => console.error('Failed to load background image');
    }, []);
    useEffect(() => {
        bottomSpriteImage.current = new Image();
        bottomSpriteImage.current.src = fortress;
        bottomSpriteImage.current.onerror = () => console.error('Failed to load fortress image');
    }, []);

    // --- API Interaction Callbacks ---
    const toggleSkill = useCallback(async (skillId) => {
        if (!setActiveSkillsAndRefresh || !originalInitialData.current) return; // Need original data for ownership check

        const currentSkillsArray = Object.entries(passiveSkillsRef.current).filter(([, a]) => a).map(([k]) => k);
        let nextSkillsArray;
        const isCurrentlyActive = currentSkillsArray.includes(skillId);

        if (isCurrentlyActive) {
            nextSkillsArray = currentSkillsArray.filter(id => id !== skillId);
        } else {
            // Check ownership from the *original* data before activating
            const ownedCategory = Object.keys(originalInitialData.current.ownedItems).find(category =>
                 originalInitialData.current.ownedItems[category]?.includes(skillId)
            );
            if (ownedCategory) { // Check if the skill ID exists in any owned category
                 nextSkillsArray = [...currentSkillsArray, skillId];
            } else {
                 console.warn(`Attempted to activate unowned item: ${skillId}`);
                 return;
            }
        }

        // Optimistic UI update
        setPassiveSkills(prev => ({ ...prev, [skillId]: !prev[skillId] }));

        try {
            await setActiveSkillsAndRefresh(nextSkillsArray);
        } catch (error) {
            console.error(`Failed to toggle skill ${skillId} via API:`, error);
            // Revert UI on failure
            setPassiveSkills(prev => ({ ...prev, [skillId]: !prev[skillId] }));
            // Show error to user
        }
    }, [setActiveSkillsAndRefresh]); 

    // Update currency earned during the game session
    const handleEnemyKilled = useCallback((enemy) => {
        const newScore = score + enemy.score;
        setScore(newScore);
        const scoreBasedCurrencyGain = Math.floor(newScore / 2) - Math.floor(lastConvertedScoreCurrency.current / 2);
        if (scoreBasedCurrencyGain > 0) {
            setCurrentCurrencyInGame(prev => prev + scoreBasedCurrencyGain);
            lastConvertedScoreCurrency.current = newScore;
        }
    }, [score, currentCurrencyInGame]);// Depend on internal state

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

    const handleWeaponFire = useCallback(() => {
        if (isPaused || !playerRef.current) return;
        const player = playerRef.current;

        const fired = player.attemptFire(mousePos.current, createBulletsCallbackForPlayer);
        if (fired || player.isReloading()) { // Update state if fire attempted or reload started
            setCurrentAmmo(player.getCurrentAmmo());
            setIsReloading(player.isReloading());
            setReloadTime(player.getReloadTimeRemaining());
        }
    }, [isPaused, createBulletsCallbackForPlayer]);

    const handlePlayerDamage = useCallback((damage, attacker) => {
        const player = playerRef.current;
        if (!player) return;
        if (player.canTakeDamage()) {
            // Access skills via ref inside callback
            PassiveSkills.thorns(damage, attacker, passiveSkillsRef.current.thorns);
            if (player.takeDamage(damage)) {
                setGameOver(true); // Trigger game over state
            }
            setPlayerHealth(player.getHealth()); // Update health state
        }
    }, []);

    const handleRestart = useCallback(() => {
        console.log("Restarting game...");
        // Clear intervals associated with enemies
        enemies.current.forEach(enemy => {
            if (enemy.damageInterval) clearInterval(enemy.damageInterval);
            enemy.damageInterval = null;
        });

        // Reset game state variables
        setWin(false);
        setGameOver(false);
        setScore(0); // Reset session score
        setTimeElapsed(0);
        setEnemyScalingFactor(1); // Reset scaling
        setCurrentEnemySpawnCount(ENEMY_SPAWN_COUNT); // Reset spawn count
        setBaseHealth(INITIAL_BASE_HEALTH); // Reset base health

        // Reset internal tracking
        lastConvertedScoreCurrency.current = 0;

        // Reset game objects
        items.current = [];
        bullets.current = [];
        enemies.current = [];
        drones.current = []; // TODO: Reinitialize drones based on initial data?
        turrets.current = [ // Reset turrets to default placement
            { x: 150, y: null, angle: 0, targetEnemy: null, lastFireTime: 0 },
            { x: null, y: null, angle: 0, targetEnemy: null, lastFireTime: 0 }
        ];

        // Reset player state using the *original* data passed when the component mounted
        const originalData = originalInitialData.current || initialPlayerData; // Fallback just in case
        if (playerRef.current) {
            playerRef.current.reset(window.innerWidth / 2, window.innerHeight / 2, DEFAULT_PLAYER_HEALTH);
            setPlayerHealth(DEFAULT_PLAYER_HEALTH);

            const initialWeaponName = originalData?.currentWeapon || DEFAULT_WEAPON;
            if (weaponDefinitions[initialWeaponName]) {
                playerRef.current.switchWeapon(initialWeaponName);
                setCurrentWeaponInfo({ ...weaponDefinitions[initialWeaponName] });
                setCurrentAmmo(weaponDefinitions[initialWeaponName].maxAmmo);
            } else {
                playerRef.current.switchWeapon(DEFAULT_WEAPON);
                setCurrentWeaponInfo({ ...weaponDefinitions[DEFAULT_WEAPON] });
                setCurrentAmmo(weaponDefinitions[DEFAULT_WEAPON].maxAmmo);
            }

            setIsReloading(false);
            setReloadTime(0);
        }

        // Reset internal currency/level to what they were initially for this game mount
        setCurrentCurrencyInGame(originalData?.currency ?? DEFAULT_CURRENCY);
        setCurrentLevelInGame(originalData?.level ?? DEFAULT_LEVEL);

        // Reset skills state based on original data
        const activeSkillsMap = {};
        Object.keys(PassiveSkills).forEach(key => {
            activeSkillsMap[key] = originalData?.activeSkills?.includes(key) ?? false;
        });
        setPassiveSkills(activeSkillsMap);
        // passiveSkillsRef updated via useEffect


        // Reset input states
        keys.current = { w: false, a: false, s: false, d: false, spacebar: false };
        mouseDown.current = false;

        // Stop music? Or let it continue/restart? Handled by playBackgroundMusic useEffect
        setIsPaused(false); // Ensure game is not paused after restart


    }, [initialPlayerData]);

    const cleanupGame = useCallback(() => {
        enemies.current.forEach(enemy => { if (enemy.damageInterval) clearInterval(enemy.damageInterval); });
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
        enemies.current = []; bullets.current = []; items.current = []; drones.current = []; turrets.current = [];
        playerRef.current = null;
    }, []);

    // --- Get Final Game State for Saving ---
    const getFinalGameState = useCallback(() => {
        const levelFromScore = Math.floor(score / 100);
        const originalLevel = originalInitialData.current?.level ?? DEFAULT_LEVEL;
        const finalLevel = Math.max(currentLevelInGame, originalLevel) + levelFromScore;
        const activeSkillIds = Object.entries(passiveSkills).filter(([, a]) => a).map(([k]) => k);
        return {
            currency: currentCurrencyInGame,
            level: finalLevel,
            kills: score,
            currentWeaponName: playerRef.current?.getCurrentWeaponInfo().name || DEFAULT_WEAPON,
            activeSkillIds: activeSkillIds,
        };
    }, [score, currentCurrencyInGame, currentLevelInGame, passiveSkills]);

    // Input handlers
    const handleMouseMove = useCallback((e) => { mousePos.current = { x: e.clientX, y: e.clientY }; }, []);

    const handleMouseDown = useCallback((e) => { if (!isPaused) { mouseDown.current = true; if (playerRef.current && !playerRef.current.getCurrentWeaponInfo().isAutomatic) { handleWeaponFire(); } } }, [isPaused, handleWeaponFire]);

    const handleMouseUp = useCallback(() => { mouseDown.current = false; }, []);

    // Weapon switching now only affects internal player state
    const handleWeaponSwitch = useCallback((weaponName) => {
        // Check ownership against the *original* data for this session
       const ownedWeapons = originalInitialData.current?.ownedItems?.weapons || [DEFAULT_WEAPON];
       if (!ownedWeapons.includes(weaponName)) {
            console.warn(`Attempted switch to unowned weapon: ${weaponName}`); return;
       }
       if (playerRef.current) {
           playerRef.current.switchWeapon(weaponName);
           const newInfo = playerRef.current.getCurrentWeaponInfo();
           if(weaponDefinitions[newInfo.name]){
                setCurrentWeaponInfo({ ...weaponDefinitions[newInfo.name] });
                setCurrentAmmo(playerRef.current.getCurrentAmmo());
                setIsReloading(playerRef.current.isReloading());
                setReloadTime(playerRef.current.getReloadTimeRemaining());
           }
       }
   }, [initialPlayerData]);

    const handleKeyDown = useCallback((e) => {
        if (!playerRef.current) return; // Don't handle keys if player doesn't exist
        const key = e.key.toLowerCase();
        if (keys.current.hasOwnProperty(key)) keys.current[key] = true;

        switch (key) {
            case '1': handleWeaponSwitch('pistol'); break;
            case '2': handleWeaponSwitch('shotgun'); break;
            case '3': handleWeaponSwitch('machinegun'); break;
            // Add cases for other owned weapons if necessary
            case 'r':
                playerRef.current.startReload();
                setIsReloading(playerRef.current.isReloading());
                setReloadTime(playerRef.current.getReloadTimeRemaining());
                break;
            case 'escape': // Toggle pause
                setIsPaused(prev => !prev);
                break;
            // Add other keybinds if needed (e.g., activate ultimate?)
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

    // =============================
    // === Main Game Loop Effect ===
    // =============================
    useEffect(() => {
        if (!canvasRef.current || !playerRef.current || !spritesLoaded || !initialPlayerData) {
            console.log("Game loop waiting for initialization...");
            return; // Don't start the loop yet
        }
        console.log("Starting game loop...");

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let enemySpawnIntervalId;

        const spawnEnemy = () => {
            if (isPaused || win || gameOver || !canvasRef.current) return; // Check canvas again

            const spawnZoneWidth = canvas.width * 0.1;
            const minX = spawnZoneWidth;
            const maxX = canvas.width - (spawnZoneWidth + (0.05 * canvas.width)); // Adjusted slightly
            const newEnemies = [];

            for (let i = 0; i < currentEnemySpawnCount; i++) {
                const type = getRandomEnemyType();
                // Calculate random X within the allowed horizontal range
                const x = Math.random() * (maxX - minX) + minX;
                const y = -100; // Start above the screen

                const enemy = new Enemy(x, y, type, enemyScalingFactor);
                enemy.setSpriteRefs(enemySpriteRefs.current[type]); // Ensure sprites are loaded/passed
                newEnemies.push(enemy);
            }
            enemies.current.push(...newEnemies);
        };

        const updateGame = () => {
            if (isPaused || !ctx || !canvas || !playerRef.current) { // Check playerRef too
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

            ctx.save();
            // Apply screen shake if active
            if (screenShakeRef.current.active) ctx.translate(offsetX, offsetY);

            // --- Updates ---
            updatePlayer();
            updateEnemies();
            updateBullets();
            updateTurrets();
            updateDrones();
            updateItems();

            // --- Draws ---
            drawBackground();
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

            // Automatic fire
            const weaponInfo = player.getCurrentWeaponInfo();
            if (weaponDefinitions[weaponInfo.name]?.isAutomatic && mouseDown.current) { // Check definition
                handleWeaponFire(); // Use the unified fire handler
            }

            // Reload update
            const reloadFinished = player.updateReload(Date.now());
            if (reloadFinished) {
                setCurrentAmmo(player.getCurrentAmmo());
                setIsReloading(player.isReloading());
                setReloadTime(player.getReloadTimeRemaining());
            } else if (player.isReloading()) {
                setReloadTime(player.getReloadTimeRemaining());
            }

            // Apply passive skills using the ref for current state
            if (passiveSkillsRef.current.recovery) {
                const prevHealth = player.getHealth();
                PassiveSkills.recovery(player, true);
                if (player.getHealth() !== prevHealth) {
                    setPlayerHealth(player.getHealth());
                }
            }
            const speedModifier = passiveSkillsRef.current.momentum ? PassiveSkills.momentum(player, true) : 1.0;
            player.setSpeedModifier(speedModifier);


            player.update(keys.current, { width: canvas.width, height: canvas.height });
        };

        const updateEnemies = () => {
            const lineY = canvas.height - LINE_Y_OFFSET;
            enemies.current = enemies.current.filter((enemy) => {
                if (isPaused || !playerRef.current) return true;

                // *** Call Enemy's own update method ***
                enemy.update(playerRef.current, canvas, lineY);

                // *** Game Logic interacting with enemy state ***
                // Start damaging base if stopped at the line
                if (enemy.isStopped && !enemy.damageInterval && baseHealth > 0) {
                    enemy.damageInterval = setInterval(() => {
                        if (win || gameOver || isPaused || !enemies.current.includes(enemy)) {
                            clearInterval(enemy.damageInterval);
                            enemy.damageInterval = null;
                            return;
                        }
                        setBaseHealth(prev => Math.max(0, prev - enemy.damage));
                    }, BASE_DAMAGE_INTERVAL);
                }
                // Clear interval if enemy starts moving again (e.g., knockback)
                 else if (!enemy.isStopped && enemy.damageInterval) {
                     clearInterval(enemy.damageInterval);
                     enemy.damageInterval = null;
                 }


                // --- Collision Checks ---
                let killedByBullet = false;
                bullets.current = bullets.current.filter((bullet) => {
                    if (checkCollision(bullet, enemy)) {
                        applyScreenShake(/* Intensity based on bullet.weaponType */);
                        const knockbackAngle = bullet.angle ?? Math.atan2(bullet.y - (enemy.y + enemy.size/2), bullet.x - (enemy.x + enemy.size/2));
                        const killed = enemy.takeDamage(bullet.damage, weaponDefinitions[bullet.weaponType]?.recoilForce || 1, knockbackAngle);

                        if (killed) {
                            killedByBullet = true;
                            handleEnemyKilled(enemy);
                            const healAmount = PassiveSkills.lifeSteal(bullet.damage, passiveSkillsRef.current.lifeSteal);
                            if (healAmount > 0 && playerRef.current) {
                                playerRef.current.heal(healAmount);
                                setPlayerHealth(playerRef.current.getHealth());
                            }
                        }
                        return false; // Remove bullet
                    }
                    return true; // Keep bullet
                });

                if (checkPlayerCollision(enemy)) {
                    handlePlayerDamage(enemy.damage, enemy);
                    const knockbackAngle = Math.atan2(enemy.y - playerRef.current.y, enemy.x - playerRef.current.x);
                    enemy.applyKnockback(15, knockbackAngle + Math.PI); // Knock away from player
                }

                // --- Cleanup ---
                if (enemy.health <= 0) {
                    if (enemy.damageInterval) clearInterval(enemy.damageInterval);
                    if (!killedByBullet) handleEnemyKilled(enemy); // Score if killed by other means
                    // TODO: Play death sound, spawn explosion/particles
                    return false; // Remove enemy
                }
                return true; // Keep enemy
            });
        };

        const updateItems = () => { checkItemCollisions(); items.current.forEach(i => i.update()); }; 

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

        const drawBackground = () => { if (backgroundImageRef.current?.complete) ctx.drawImage(backgroundImageRef.current, 0, 0, canvas.width, canvas.height); };
        const drawItems = () => { items.current.forEach(item => item.draw(ctx)); };
        const drawPlayer = () => { playerRef.current?.draw(ctx, mousePos.current, playerSpriteRefs); };
        const drawEnemies = () => { enemies.current.forEach(enemy => enemy.draw(ctx)); };

        const drawCursor = () => {
            const player = playerRef.current;
            if (!player || !mousePos.current || !cursorImageRef.current?.complete) return;
        
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
            ctx.drawImage(cursorImageRef.current, -size / 2, -size / 2, size, size);
        
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
                                bullet.weaponType === 'machinegun' ? '#232624' :
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

        // --- Start Game Systems ---
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
        const visibilityHandler = () => { setIsPaused(document.hidden); if (document.hidden) keys.current = { w: false, a: false, s: false, d: false }; };
        document.addEventListener('visibilitychange', visibilityHandler);

        // Cleanup
        return () => {
            console.log("Cleaning up game loop and listeners...");
            clearInterval(enemySpawnIntervalId);
            cancelAnimationFrame(animationFrameId);
            enemies.current.forEach(enemy => {
                if (enemy.damageInterval) clearInterval(enemy.damageInterval);
            });
             // Important: Remove listeners to prevent memory leaks
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            document.removeEventListener('visibilitychange', visibilityHandler);
            // No need to call cleanupGame here, it's called by Game component on unmount/navigate
        };
    }, [
        canvasRef, initialPlayerData, spritesLoaded, gameDuration,
        // State that controls the loop running
        win, gameOver, isPaused,
        // Callbacks used inside the loop
        handleMouseMove, handleMouseDown, handleMouseUp, handleKeyDown, handleKeyUp,
        createBulletsCallbackForPlayer, handleWeaponSwitch, handleEnemyKilled,
        applyScreenShake, checkItemCollisions, handlePlayerDamage, handleWeaponFire, // Added handleWeaponFire
        updateScreenShake, toggleSkill, // Added toggleSkill if it modifies refs used in loop
        setActiveSkillsAndRefresh
    ]);

    return {
        // Game State
        win,
        gameOver,
        isPaused,
        baseHealth,
        score, // Session kills/score
        timeElapsed,
        playerHealth,
        currentWeaponInfo,
        currentAmmo,
        isReloading,
        reloadTime,
        passiveSkills, // Current active skills map
        maxDrones,
        currentCurrencyInGame, // Currency managed during the game

        // Methods
        handleRestart,
        toggleSkill, // Use the new API-integrated version
        updateDroneCount: (newCount) => setMaxDrones(Math.max(0, newCount)),
        getFinalGameState, // Function to get data for saving
        cleanupGame, // Function to clear resources

        // Input Handlers (if needed by Game component directly, though unlikely)
        // handleMouseMove, handleMouseDown, handleMouseUp, handleKeyDown, handleKeyUp,
        setIsPaused,

        // Music Controls
        isMusicPlaying,
        musicVolume,
        toggleMusic,
        setVolume,

        // Refs (if Game component needs direct access, unlikely)
        // canvasRef: engineCanvasRef // Pass back the ref if needed elsewhere? No, Game passes it in.

        applyScreenShake // If UI elements outside need to trigger shake
    };
};

export default useGameEngine;