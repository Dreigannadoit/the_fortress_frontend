import { getScaledValue } from "../utils/getScaledValue";
import { weapons } from "../constansts/constants";
import { character_hurt, rockSpellSound, slingshotSound, wizardWandSound } from "../assets";

// --- Constants ---a
const PLAYER_RADIUS = 50;
const PLAYER_SPEED = 4;
const RECOIL_DECAY = 0.9;
const INITIAL_PLAYER_HEALTH = 100;

class Player {
    constructor(initialX, initialY) {
        this.x = initialX;
        this.y = initialY;
        this.radius = getScaledValue(PLAYER_RADIUS);
        this.speed = PLAYER_SPEED;
        this.velocity = { x: 0, y: 0 };
        this.recoilVelocity = { x: 0, y: 0 };
        this.health = INITIAL_PLAYER_HEALTH;
        this.maxHealth = INITIAL_PLAYER_HEALTH;
        this.lastDamageTime = 0; // Track last damage for passive skills
        this.speedModifier = 1.0; // For momentum passive
        this.lastHitTime = 0;
        this.invincibilityDuration = 20; // 1 second invincibility after hit

        // Weapon state
        const initialWeaponConfig = weapons.pistol;
        this.currentWeapon = {
            ...initialWeaponConfig,
            currentAmmo: initialWeaponConfig.maxAmmo,
            lastFireTime: 0,
            isReloading: false,
            lastReloadTime: 0,
        };

        // Animation state
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 100; // ms per frame
        this.isFacingFront = true;

        this._reloadTimeRemaining = 0;
        this.reloadModifier = 1.0;
        this.loadSounds();
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    setSpeedModifier(modifier) {
        this.speedModifier = modifier;
    }

    // --- Getters for GameScene State ---
    getHealth() {
        return this.health;
    }

    getMaxHealth() {
        return this.maxHealth;
    }

    getCurrentAmmo() {
        return this.currentWeapon.currentAmmo;
    }

    getCurrentWeaponInfo() {
        // Return a copy to prevent direct modification from outside
        return { ...this.currentWeapon };
    }

    isReloading() {
        return this.currentWeapon.isReloading;
    }

    getReloadTimeRemaining() {
        return this._reloadTimeRemaining;
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }

    getRadius() {
        return this.radius;
    }


    getLastDamageTime() {
        return this.lastDamageTime;
    }

    setReloadModifier(modifier) {
        this.reloadModifier = modifier;
    }


    // --- Core Logic Methods ---
    update(keys, canvasBounds) {
        const prevVelocity = { ...this.velocity };

        // Your existing movement code...
        const baseSpeed = this.speed * this.speedModifier;
        this.velocity = { x: 0, y: 0 };
        if (keys.w) this.velocity.y -= baseSpeed;
        if (keys.s) this.velocity.y += baseSpeed;
        if (keys.a) this.velocity.x -= baseSpeed;
        if (keys.d) this.velocity.x += baseSpeed;

        // Detect movement change
        const wasMoving = Math.abs(prevVelocity.x) > 0.1 || Math.abs(prevVelocity.y) > 0.1;
        const isMoving = Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.y) > 0.1;

        // Update animation timer only when moving
        const now = Date.now();
        if (isMoving) {
            if (!wasMoving) {
                // Just started moving - reset animation
                this.animationFrame = 0;
                this.animationTimer = now;
            } else if (now - this.animationTimer > this.animationSpeed) {
                this.animationFrame = (this.animationFrame + 1) % 4;
                this.animationTimer = now;
            }
        }

        this.recoilVelocity.x *= RECOIL_DECAY;
        this.recoilVelocity.y *= RECOIL_DECAY;

        this.x += this.velocity.x + this.recoilVelocity.x;
        this.y += this.velocity.y + this.recoilVelocity.y;

        if (canvasBounds) {
            this.x = Math.max(this.radius, Math.min(canvasBounds.width - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(canvasBounds.height - this.radius, this.y));
        }

        if (this.currentWeapon.isReloading) {
            const elapsed = Date.now() - this.currentWeapon.lastReloadTime;
            this._reloadTimeRemaining = Math.max(0, this.currentWeapon.reloadDuration - elapsed);
        } else {
            const fireElapsed = Date.now() - this.currentWeapon.lastFireTime;
            this._reloadTimeRemaining = Math.max(0, this.currentWeapon.fireRate - fireElapsed);
        }
    }

    updateReload(now) {
        if (!this.currentWeapon.isReloading) return false;
        const reloadProgress = now - this.currentWeapon.lastReloadTime;
        if (reloadProgress >= this.currentWeapon.effectiveReloadDuration) {
            this.currentWeapon.isReloading = false;
            this.currentWeapon.currentAmmo = this.currentWeapon.maxAmmo;
            this._reloadTimeRemaining = 0;
            return true;
        } else {
            this._reloadTimeRemaining = this.currentWeapon.effectiveReloadDuration - reloadProgress;
        }
        return false;
    }

    loadSounds() {
        this.weaponSounds = {
            pistol: new Audio(slingshotSound),
            shotgun: new Audio(wizardWandSound),
            machinegun: new Audio(rockSpellSound),
        };

        this.damageSound = new Audio(character_hurt);
        this.damageSound.volume = 0.7;

        // Optional: Reduce latency
        Object.values(this.weaponSounds).forEach(audio => {
            audio.load();
        });
        this.damageSound.load();
    }

    applyRecoil(angle) {
        let recoilForce = 0;
        switch (this.currentWeapon.name) {
            case "pistol": recoilForce = 0.5; break;
            case "shotgun": recoilForce = 15; break;
            case "machinegun": recoilForce = 3; break;
            default: return;
        }
        this.recoilVelocity.x -= Math.cos(angle) * recoilForce;
        this.recoilVelocity.y -= Math.sin(angle) * recoilForce;
    }

    startReload() {
        if (this.currentWeapon.isReloading || this.currentWeapon.currentAmmo === this.currentWeapon.maxAmmo) return;
        this.currentWeapon.isReloading = true;
        this.currentWeapon.lastReloadTime = Date.now();
        this.currentWeapon.effectiveReloadDuration = this.currentWeapon.reloadDuration * this.reloadModifier;
        this._reloadTimeRemaining = this.currentWeapon.effectiveReloadDuration;
    }

    // Renamed to attemptFire to better reflect its role
    attemptFire(mousePos, createBulletsCallback) {
        const weapon = this.currentWeapon;
        const now = Date.now();
    
        if (!weapon.unlocked || weapon.isReloading) return false;
        if (now - weapon.lastFireTime < weapon.fireRate) return false;
        if (weapon.currentAmmo <= 0) {
            this.startReload();
            return false;
        }
    
        const angle = Math.atan2(mousePos.y - this.y, mousePos.x - this.x);
        this.applyRecoil(angle);
    
        weapon.currentAmmo--;
        createBulletsCallback(this, weapon, mousePos);
        weapon.lastFireTime = now;
        this._reloadTimeRemaining = weapon.fireRate;
    
        // 🔊 Play shoot sound
        const shootSound = this.weaponSounds[weapon.name];
        if (shootSound) {
            const soundClone = shootSound.cloneNode();
            soundClone.volume = shootSound.volume;
            soundClone.play();
        }
    
        if (weapon.currentAmmo <= 0) {
            this.startReload();
        }
    
        return true;
    }    

    switchWeapon(weaponName) {
        if (!weapons[weaponName] || !weapons[weaponName].unlocked) {
            console.warn(`Attempted to switch to locked or invalid weapon: ${weaponName}`);
            return;
        }
        if (this.currentWeapon.name === weaponName) return;

        const newWeaponConfig = weapons[weaponName];
        this.currentWeapon = {
            ...newWeaponConfig,
            currentAmmo: newWeaponConfig.maxAmmo,
            lastFireTime: 0,
            isReloading: false,
            lastReloadTime: 0,
        };
        this._reloadTimeRemaining = 0;

        // Add weapon type tracking
        this.currentWeaponType = weaponName;
    }

    canTakeDamage() {
        return Date.now() - this.lastHitTime > this.invincibilityDuration;
    }

    takeDamage(amount) {
        if (!this.canTakeDamage()) return false;
    
        this.health = Math.max(0, this.health - amount);
        this.lastHitTime = Date.now();
        this.lastDamageTime = Date.now();
    
        // 🔊 Play damage sound
        if (this.damageSound) {
            this.damageSound.currentTime = 0;
            this.damageSound.play();
        }
    
        return this.health <= 0;
    }    

    draw(ctx, mousePos, playerSpriteRefs) {
        // Debug: Verify sprite refs
        // console.log('Available sprites:', Object.keys(playerSpriteRefs).filter(k => playerSpriteRefs[k]?.current));

        // Determine animation state
        const isCursorBelow = mousePos.y > this.y;
        this.isFacingFront = isCursorBelow;
        const isCursorLeft = mousePos.x < this.x;

        // More sensitive movement detection
        const isMoving = Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.y) > 0.1;
        const now = Date.now();

        // Animation frame update
        if (isMoving) {
            if (now - this.animationTimer > this.animationSpeed) {
                this.animationFrame = (this.animationFrame + 1) % 4;
                this.animationTimer = now;
                // console.log('Advanced to frame:', this.animationFrame); // Debug
            }
        } else {
            this.animationFrame = 0; // Reset to idle frame
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Get current sprite
        const direction = this.isFacingFront ? 'front' : 'back';
        const spriteKey = `${direction}_${this.animationFrame}`;
        let playerImage = playerSpriteRefs[spriteKey]?.current;

        // console.log('Attempting to draw:', spriteKey, 'exists:', !!playerImage);

        if (!playerImage) {
            console.warn('Missing sprite:', spriteKey);
            // Fallback to frame 0 if current frame is missing
            const fallbackKey = `${direction}_0`;
            const fallbackImage = playerSpriteRefs[fallbackKey]?.current;

            if (fallbackImage) {
                // console.log('Using fallback frame');
                playerImage = fallbackImage;
            } else {
                // Ultimate fallback - red circle
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                return;
            }
        }

        // Draw the sprite
        const scale = this.radius * 2 / Math.max(playerImage.width, playerImage.height);
        const width = playerImage.width * scale;
        const height = playerImage.height * scale;

        ctx.save();
        ctx.translate(this.x, this.y);
        if (isCursorLeft) ctx.scale(-1, 1); // Flip if looking left

        ctx.drawImage(
            playerImage,
            -width / 2,
            -height / 2,
            width,
            height
        );

        ctx.restore();
    }


    reset(initialX, initialY) {
        this.x = initialX;
        this.y = initialY;
        this.health = this.maxHealth;
        this.velocity = { x: 0, y: 0 };
        this.recoilVelocity = { x: 0, y: 0 };
        this.lastDamageTime = 0; // Reset passive skill timers
        this.speedModifier = 1.0; // Reset speed modifier

        const initialWeaponConfig = weapons.pistol;
        this.currentWeapon = {
            ...initialWeaponConfig,
            currentAmmo: initialWeaponConfig.maxAmmo,
            lastFireTime: 0,
            isReloading: false,
            lastReloadTime: 0,
        };

        this._reloadTimeRemaining = 0;
    }
}

export default Player;