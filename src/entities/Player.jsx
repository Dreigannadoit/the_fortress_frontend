import { getScaledValue } from "../utils/getScaledValue";
import { weapons } from "../constansts/constants";

// --- Constants ---a
const PLAYER_RADIUS = 20;
const PLAYER_SPEED = 5;
const RECOIL_DECAY = 0.9;
const PLAYER_SPRITE_WIDTH = 80;
const PLAYER_SPRITE_HEIGHT = 80;
const PLAYER_SPRITE_SCALE = 1;
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

        this._reloadTimeRemaining = 0;
        this.reloadModifier = 1.0;
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
        // Use speed modifier for movement calculations
        const baseSpeed = this.speed * this.speedModifier;

        const moveVelocity = { x: 0, y: 0 };
        if (keys.w) moveVelocity.y -= baseSpeed;
        if (keys.s) moveVelocity.y += baseSpeed;
        if (keys.a) moveVelocity.x -= baseSpeed;
        if (keys.d) moveVelocity.x += baseSpeed;

        this.recoilVelocity.x *= RECOIL_DECAY;
        this.recoilVelocity.y *= RECOIL_DECAY;

        this.x += moveVelocity.x + this.recoilVelocity.x;
        this.y += moveVelocity.y + this.recoilVelocity.y;

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
        // Call the callback provided by GameScene to actually create bullets
        createBulletsCallback(this, weapon, mousePos);
        weapon.lastFireTime = now;
        this._reloadTimeRemaining = weapon.fireRate; // Set cooldown timer for UI

        if (weapon.currentAmmo <= 0) {
            this.startReload();
        }
        return true; // Fired successfully
    }

    switchWeapon(weaponName) {
        if (!weapons[weaponName] || !weapons[weaponName].unlocked) {
            console.warn(`Attempted to switch to locked or invalid weapon: ${weaponName}`);
            return; // Don't switch if locked or doesn't exist
        }
        if (this.currentWeapon.name === weaponName) return; // Already equipped

        const newWeaponConfig = weapons[weaponName];
        this.currentWeapon = {
            ...newWeaponConfig,
            // Persist ammo if needed, or reset like original code:
            currentAmmo: newWeaponConfig.maxAmmo,
            lastFireTime: 0, // Reset fire timer
            isReloading: false, // Cancel any ongoing reload
            lastReloadTime: 0,
        };
        this._reloadTimeRemaining = 0; // Reset UI timer
        console.log(`Switched weapon to: ${weaponName}`);
    }

    canTakeDamage() {
        return Date.now() - this.lastHitTime > this.invincibilityDuration;
    }

    takeDamage(amount) {
        if (!this.canTakeDamage()) return false;

        this.health = Math.max(0, this.health - amount);
        this.lastHitTime = Date.now();
        this.lastDamageTime = Date.now(); // Add this line
        return this.health <= 0;
    }

    draw(ctx, mousePos, playerImage) {
        if (!playerImage) return; // Don't draw if image not loaded

        const angle = Math.atan2(mousePos.y - this.y, mousePos.x - this.x);
        const drawWidth = PLAYER_SPRITE_WIDTH * PLAYER_SPRITE_SCALE;
        const drawHeight = PLAYER_SPRITE_HEIGHT * PLAYER_SPRITE_SCALE;

        // Momentum visual effect
        if (this.speedModifier > 1.0) {
            ctx.filter = `hue-rotate(${Date.now() % 360}deg)`;
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle + Math.PI / 2); // Add PI/2 because sprite might face upwards

        ctx.drawImage(
            playerImage,
            -drawWidth / 2,
            -drawHeight / 2,
            drawWidth,
            drawHeight
        );

        ctx.restore();

        // Optional: Draw Gun Direction (DEBUG) - Keep if useful
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + Math.cos(angle) * 30, this.y + Math.sin(angle) * 30);
        ctx.strokeStyle = 'rgba(255, 0, 0, 0)'; // Invisible
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.filter = 'none'; // Reset filter
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