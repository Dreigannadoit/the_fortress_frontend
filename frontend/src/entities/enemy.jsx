import { getScaledValue } from "../utils/getScaledValue";
import { ENEMY_TYPES } from "../constansts/constants";
import { fast_hurt, normal_death, tank_death, tank_hurt } from "../assets";
import playSound from "../utils/playSound";

const ENEMY_SOUNDS = {
    normal: {
        hurt: new Audio(tank_hurt),
        death: new Audio(normal_death)
    },
    fast: {
        hurt: new Audio(tank_hurt),
        death: new Audio(fast_hurt)
    },
    strong: {
        hurt: new Audio(tank_hurt),
        death: new Audio(tank_death)
    }
};

const POPUP_DURATION = 200; // 0.2 seconds in milliseconds
// ... (other constants remain the same)

const PLAYER_COLLISION_BOUNCE_MAGNITUDE = 15;

export default class Enemy {
    constructor(x, y, type, scalingFactor = 1) {
        const config = ENEMY_TYPES[type] || ENEMY_TYPES.normal;

        this.x = x;
        this.y = y;
        this.type = type;
        this.size = getScaledValue(config.size);
        this.speed = getScaledValue(config.speed) * scalingFactor;
        this.velocity = { x: 0, y: 0 };
        this.health = config.health * scalingFactor;
        this.maxHealth = config.health * scalingFactor;
        this.damage = config.damage; // Damage this enemy deals
        this.score = config.score;
        this.knockbackResistance = config.knockbackResistance;
        this.behavior = config.behavior;
        this.color = config.color;

        // Cooldown for dealing damage to player
        // You can add 'dealDamageCooldown' to your ENEMY_TYPES config for specific enemies
        this.dealDamageCooldown = (config.dealDamageCooldown !== undefined) ? config.dealDamageCooldown : 1000; // Default 1000ms (1 second)
        this.lastDealtDamageTimestamp = 0; // Timestamp of when this enemy last damaged the player

        // State
        this.isStopped = false;
        this.damageInterval = null; // Note: this.damageInterval seems unused for dealing damage previously
        this.lastHitTime = 0; // Renamed from lastDamageTime for clarity: when this enemy was last hit

        // Burning
        this.isBurning = false;
        this.burnStart = null;
        this.burnDamage = 0;

        // Animation properties
        this.spriteRefs = null;
        this.animationFrames = [];
        this.currentFrame = 0;
        this.frameCount = 0;
        this.animationSpeed = 8;
        this.facingRight = true;
        this.lastPlayerX = 0;
        this.lastPlayerY = 0;

        // Flash effect
        this.isFlashing = false;
        this.flashStartTime = 0;

        // handle Popup interval
        this.damagePopups = [];

        this.loadSprites(type);
    }

    checkPlayerCollision(player) {
        if (!player || !player.getPosition || !player.getRadius) return false; // Added getRadius check

        const playerPos = player.getPosition();
        const playerRadius = player.getRadius();
        const enemyCenterX = this.x + this.size / 2;
        const enemyCenterY = this.y + this.size / 2;

        const dx = enemyCenterX - playerPos.x;
        const dy = enemyCenterY - playerPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < (playerRadius + this.size / 2);
    }

    update(player, canvas, lineY) {
        if (player && player.getPosition) {
            const playerPos = player.getPosition();
            this.lastPlayerX = playerPos.x;
            this.lastPlayerY = playerPos.y;
        }

        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.x *= 0.9;
        this.velocity.y *= 0.9;

        const maxY = lineY - this.size;

        if (this.type === 'fast' && player) {
            this.facingRight = this.lastPlayerX > (this.x + this.size / 2);
        }

        switch (this.behavior) {
            case 'chase':
                this.#chasePlayer(player, maxY);
                break;
            case 'ground':
            default:
                this.#moveGround(maxY);
        }

        this.x = Math.max(0, Math.min(canvas.width - this.size, this.x));
        this.#updateBurn();

        if (this.isStopped && this.y < lineY - this.size) {
            this.isStopped = false;
        }

        let didAttemptDamage = false; // Flag to return

        // Player collision, bounce, and determining if damage should be dealt
        if (player && player.getPosition && player.getRadius && this.checkPlayerCollision(player)) {
            // Check if this enemy is ready to deal damage (cooldown)
            const currentTime = Date.now();
            if (currentTime - this.lastDealtDamageTimestamp >= this.dealDamageCooldown) {
                // This enemy is attempting to deal damage in this frame.
                // The actual player.takeDamage() and resetting this.lastDealtDamageTimestamp
                // will be handled by the game engine after this update returns.
                didAttemptDamage = true;
            }

            // --- BOUNCE AND SEPARATION LOGIC (Enemy self-bounce) ---
            const playerPos = player.getPosition();
            const playerRadius = player.getRadius();

            const enemyCenterX = this.x + this.size / 2;
            const enemyCenterY = this.y + this.size / 2;

            const vecX = enemyCenterX - playerPos.x;
            const vecY = enemyCenterY - playerPos.y;
            const distanceBetweenCenters = Math.sqrt(vecX * vecX + vecY * vecY);
            const angle = (distanceBetweenCenters === 0) ? 0 : Math.atan2(vecY, vecX);

            this.applyKnockback(PLAYER_COLLISION_BOUNCE_MAGNITUDE, angle);

            const targetSeparationDist = playerRadius + this.size / 2;
            const overlap = targetSeparationDist - distanceBetweenCenters;
            const MIN_DIST_FOR_NORMALIZED_SEP = 0.01;

            if (overlap > 0) {
                const separationBuffer = 1;
                if (distanceBetweenCenters > MIN_DIST_FOR_NORMALIZED_SEP) {
                    const normVecX = vecX / distanceBetweenCenters;
                    const normVecY = vecY / distanceBetweenCenters;
                    this.x += normVecX * (overlap + separationBuffer);
                    this.y += normVecY * (overlap + separationBuffer);
                } else {
                    // Centers are too close or coincident. Default separation.
                    this.y -= (overlap + separationBuffer);
                }
            }
            // --- END BOUNCE AND SEPARATION LOGIC ---
        }

        // Clamp position to canvas with buffer (final clamp)
        const buffer = 5; // Small buffer from canvas edges
        this.x = Math.max(buffer, Math.min(canvas.width - this.size - buffer, this.x));
        this.y = Math.max(buffer, Math.min(lineY - this.size, this.y)); // maxY is lineY - this.size

        return didAttemptDamage; // Return whether a damage attempt was made
    }

    setSpriteRefs(refs) {
        this.spriteRefs = refs;
    }

    applyKnockback(force, angle) {
        const effectiveForce = force * (1 - this.knockbackResistance);
        this.velocity.x += Math.cos(angle) * effectiveForce;
        this.velocity.y += Math.sin(angle) * effectiveForce;

        const currentSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
        const maxSpeed = this.type === 'fast' ? 20 : 15;

        if (currentSpeed > maxSpeed) {
            const ratio = maxSpeed / currentSpeed;
            this.velocity.x *= ratio;
            this.velocity.y *= ratio;
        }

        if (Math.abs(this.velocity.x) < 0.1) this.velocity.x = 0;
        if (Math.abs(this.velocity.y) < 0.1) this.velocity.y = 0;
    }

    #chasePlayer(player, maxY) {
        if (!player || !player.getPosition || !player.getRadius) return;

        const playerPos = player.getPosition();
        const playerRadius = player.getRadius();
        const enemyCenterX = this.x + this.size / 2;
        const enemyCenterY = this.y + this.size / 2;

        const dxToPlayer = playerPos.x - enemyCenterX;
        const dyToPlayer = playerPos.y - enemyCenterY;
        const distanceToPlayer = Math.sqrt(dxToPlayer * dxToPlayer + dyToPlayer * dyToPlayer);

        if (distanceToPlayer < (playerRadius + this.size / 2 - 0.5)) {
            this.velocity.x *= 0.8;
            this.velocity.y *= 0.8;
            return;
        }

        if (distanceToPlayer > 0) {
            const acceleration = this.speed * 0.1;
            this.velocity.x += (dxToPlayer / distanceToPlayer) * acceleration;
            this.velocity.y += (dyToPlayer / distanceToPlayer) * acceleration;

            const currentSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
            if (currentSpeed > this.speed) {
                this.velocity.x = (this.velocity.x / currentSpeed) * this.speed;
                this.velocity.y = (this.velocity.y / currentSpeed) * this.speed;
            }
        }

        if (this.type !== 'fast' && Math.abs(this.velocity.x) > 0.5) {
            this.facingRight = this.velocity.x > 0;
        }
    }

    #moveGround(maxY) {
        if (!this.isStopped) {
            this.y += this.speed;
        }
        if (this.y >= maxY) {
            this.y = maxY;
            this.isStopped = true;
        }
    }

    #updateBurn() {
        if (this.isBurning && Date.now() - this.burnStart > 5000) {
            this.isBurning = false;
        }
    }

    updateFlash() {
        if (this.isFlashing && Date.now() - this.flashStartTime > 100) {
            this.isFlashing = false;
        }
    }

    takeDamage(damage, knockbackForce = 0, angle = 0) { // This is for when the ENEMY takes damage
        this.health -= damage;
        this.lastHitTime = Date.now(); // Record when this enemy was hit
        this.isFlashing = true;
        this.flashStartTime = Date.now();

        const sounds = ENEMY_SOUNDS[this.type] || ENEMY_SOUNDS['normal'];
        if (sounds?.hurt) playSound(sounds.hurt);

        if (knockbackForce > 0) {
            this.applyKnockback(knockbackForce, angle);
        }

        return this.health <= 0; // Return true if enemy died
    }

    applyBurn() {
        if (!this.isBurning) {
            this.isBurning = true;
            this.burnStart = Date.now();
            this.health -= 10;
        }
    }

    loadSprites(type) {
        this.animationFrames = [];
        for (let i = 0; i < 4; i++) {
            const img = new Image();
            img.src = `src/assets/animation/${type}/${type}_${i}.png`;
            this.animationFrames.push(img);
        }
    }

    updateAnimation() {
        this.frameCount++;
        if (this.frameCount >= this.animationSpeed) {
            this.frameCount = 0;
            this.currentFrame = (this.currentFrame + 1) % (this.animationFrames.length || 1);
        }
        if (this.type !== 'fast' && Math.abs(this.velocity.x) > 0.1 && this.behavior !== 'chase') {
            this.facingRight = this.velocity.x > 0;
        }
    }

    draw(ctx) {
        this.updateAnimation();
        this.updateFlash();
        ctx.save();

        if (this.isFlashing) {
            ctx.globalAlpha = 0.7;
        }

        const currentSpriteFrame = this.spriteRefs?.[this.currentFrame]?.current || this.animationFrames[this.currentFrame];
        let entityDrawX = this.x;
        let scaleX = 1;

        if (!this.facingRight) {
            entityDrawX = this.x + this.size;
            scaleX = -1;
        }

        ctx.translate(entityDrawX, this.y);
        ctx.scale(scaleX, 1);

        if (currentSpriteFrame && currentSpriteFrame.complete && currentSpriteFrame.naturalHeight !== 0) {
            try {
                ctx.drawImage(currentSpriteFrame, 0, 0, this.size, this.size);
            } catch (e) {
                console.error('Error drawing sprite:', e, currentSpriteFrame.src);
                this.drawFallback(ctx);
            }
        } else {
            this.drawFallback(ctx);
        }

        ctx.restore();
        this.drawHealthBar(ctx);
        if (this.isBurning) {
            this.drawBurningEffect(ctx);
        }
        // Your DEBUG drawing can be uncommented if needed
    }

    drawFallback(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, this.size, this.size);
    }

    drawHealthBar(ctx) {
        const barWidth = this.size;
        const barHeight = 5;
        const yOffset = -10;
        ctx.fillStyle = "black";
        ctx.fillRect(this.x, this.y + yOffset, barWidth, barHeight);
        const healthPercentage = Math.max(0, this.health / this.maxHealth);
        ctx.fillStyle = "green";
        ctx.fillRect(this.x, this.y + yOffset, barWidth * healthPercentage, barHeight);
    }

    drawBurningEffect(ctx) {
        ctx.fillStyle = `rgba(255, ${Math.floor(Math.random() * 100 + 155)}, 0, 0.7)`;
        ctx.beginPath();
        const flameX = this.x + this.size / 2 + (Math.random() - 0.5) * (this.size / 2);
        const flameY = this.y + this.size / 2 + (Math.random() - 0.5) * (this.size / 2);
        const flameRadius = Math.random() * (this.size / 4) + (this.size / 5);
        ctx.arc(flameX, flameY, flameRadius, 0, Math.PI * 2);
        ctx.fill();
    }
}