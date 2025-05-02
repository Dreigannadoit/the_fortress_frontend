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
const POPUP_RISE_AMOUNT = 30; // How many pixels the text rises
const POPUP_ENTER_DURATION = 50; // ms for fade/scale in
const POPUP_EXIT_DURATION = 100; // ms for fade/scale out
const POPUP_FONT = "bold 14px Arial";
const POPUP_COLOR_FILL = "white";
const POPUP_COLOR_STROKE = "black";
const POPUP_OFFSET_Y = -5; // Initial vertical offset from enemy top
const POPUP_RANDOM_X_RANGE = 15; // Random horizontal spread

export default class Enemy {
    constructor(x, y, type, scalingFactor = 1) {
        const config = ENEMY_TYPES[type] || ENEMY_TYPES.normal;

        this.x = x;
        this.y = y;
        this.type = type;
        this.size = getScaledValue(config.size);
        this.speed = getScaledValue(config.speed) * scalingFactor; // Apply speed scaling
        this.velocity = { x: 0, y: 0 };
        this.health = config.health * scalingFactor; // Apply health scaling
        this.maxHealth = config.health * scalingFactor; // Apply health scaling
        this.damage = config.damage;
        this.score = config.score;
        this.knockbackResistance = config.knockbackResistance;
        this.behavior = config.behavior;
        this.color = config.color;

        // State
        this.isStopped = false;
        this.velocity = { x: 0, y: 0 };
        this.damageInterval = null;
        this.lastDamageTime = null;

        // Burning
        this.isBurning = false;
        this.burnStart = null;
        this.burnDamage = 0;

        // Animation properties
        this.spriteRefs = null;
        this.animationFrames = []; // Will hold Image objects
        this.currentFrame = 0;
        this.frameCount = 0;
        this.animationSpeed = 8; // Lower is faster
        this.facingRight = true;
        this.lastPlayerX = 0; // Track player's last X position

        // Flash effect
        this.isFlashing = false;
        this.flashStartTime = 0;

        // handle Popup interval
        this.damagePopups = []; 

        // Load sprites
        this.loadSprites(type);
    }

    update(player, canvas, lineY) {
        // Store player position if available
        if (player) {
            this.lastPlayerX = player.x;
            this.lastPlayerY = player.y;
        }

        // Apply velocity and friction
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.x *= 0.9;
        this.velocity.y *= 0.9;

        const maxY = lineY - this.size;

        // For fast enemies ONLY: Face toward player regardless of movement
        if (this.type === 'fast' && player) {
            this.facingRight = this.lastPlayerX > this.x;
        }

        // Behavior-based movement
        switch (this.behavior) {
            case 'chase':
                this.#chasePlayer(player, maxY);
                break;
            case 'ground':
            default:
                this.#moveGround(maxY);
        }

        // Clamp horizontal position
        this.x = Math.max(0, Math.min(canvas.width - this.size, this.x));

        // Handle burning damage
        this.#updateBurn();

    }


    setSpriteRefs(refs) {
        this.spriteRefs = refs;
    }


    applyKnockback(force, angle) {
        this.velocity.x += Math.cos(angle) * force;
        this.velocity.y += Math.sin(angle) * force;

        // Limit maximum velocity
        const maxSpeed = 15;
        const currentSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
        if (currentSpeed > maxSpeed) {
            this.velocity.x = (this.velocity.x / currentSpeed) * maxSpeed;
            this.velocity.y = (this.velocity.y / currentSpeed) * maxSpeed;
        }
    }

    #chasePlayer(player, maxY) {
        if (!player) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            // Update velocity (smoother movement)
            this.velocity.x += (dx / distance) * this.speed * 0.1;
            this.velocity.y += (dy / distance) * this.speed * 0.1;

            // For NON-fast enemies: Update facing based on movement
            if (this.type !== 'fast' && Math.abs(this.velocity.x) > 0.1) {
                this.facingRight = this.velocity.x > 0;
            }
        }

        // Prevent going below defense line
        if (this.y > maxY) {
            this.y = maxY;
            this.velocity.y = 0;
        }
    }


    #moveGround(maxY) {
        if (!this.isStopped) {
            this.y += this.speed;
        }

        if (this.y > maxY) {
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

    takeDamage(damage, knockbackForce = 0, angle = 0) {
        this.health -= damage;
        this.lastHitTime = Date.now();
        this.isFlashing = true; // Add this line
        this.flashStartTime = Date.now(); // Add this line
    
        // Play hurt sound
        const sounds = ENEMY_SOUNDS[this.type] || ENEMY_SOUNDS['normal'];
        if (sounds?.hurt) playSound(sounds.hurt);
    
        // Apply knockback
        const effectiveKnockback = knockbackForce * (1 - this.knockbackResistance);
        if (effectiveKnockback > 0) {
            this.velocity.x += Math.cos(angle) * effectiveKnockback;
            this.velocity.y += Math.sin(angle) * effectiveKnockback;
        }
    
        return false;
    }

    applyBurn() {
        if (!this.isBurning) {
            this.isBurning = true;
            this.burnStart = Date.now();
            this.health -= 10; // Initial burn damage
        }
    }

    loadSprites(type) {
        // Assuming you have sprite frames named like: enemy_[type]_[frame].png
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
            this.currentFrame = (this.currentFrame + 1) % 4;
        }

        // Only update facing direction for non-fast enemies
        if (this.type !== 'fast' && Math.abs(this.velocity.x) > 0.1) {
            this.facingRight = this.velocity.x > 0;
        }
    }

    draw(ctx) {
        this.updateAnimation();
        this.updateFlash();
    
        ctx.save();
    
        if (this.isFlashing) {
            ctx.filter = 'hue-rotate(0deg) saturate(3)';
            ctx.opacity = 0.5;
        }
    
        // For fast enemies, just face left/right without rotation
        if (this.type === 'fast') {
            // Determine facing direction based on player position
            this.facingRight = this.lastPlayerX > this.x;
            
            const drawX = this.facingRight ? this.x : this.x + this.size;
            if (!this.facingRight) {
                ctx.translate(drawX, this.y);
                ctx.scale(-1, 1);
            } else {
                ctx.translate(this.x, this.y);
            }
    
            const frame = this.spriteRefs?.[this.currentFrame]?.current;
            if (frame?.complete) {
                try {
                    ctx.drawImage(frame, 0, 0, this.size, this.size);
                } catch (e) {
                    console.error('Error drawing fast enemy sprite:', e);
                    this.drawFallback(ctx);
                }
            } else {
                this.drawFallback(ctx);
            }
        } else {
            // Original drawing logic for other enemy types
            const drawX = this.facingRight ? this.x : this.x + this.size;
            if (!this.facingRight) {
                ctx.translate(drawX, this.y);
                ctx.scale(-1, 1);
            } else {
                ctx.translate(this.x, this.y);
            }
    
            const frame = this.spriteRefs?.[this.currentFrame]?.current;
            if (frame?.complete) {
                try {
                    ctx.drawImage(frame, 0, 0, this.size, this.size);
                } catch (e) {
                    console.error('Error drawing sprite:', e);
                    this.drawFallback(ctx);
                }
            } else {
                this.drawFallback(ctx);
            }
        }
    
        ctx.filter = 'none';
        ctx.restore();
    
        // Draw health bar (in original coordinates)
        this.drawHealthBar(ctx);
    
        // Draw burning effect if needed
        if (this.isBurning) {
            this.drawBurningEffect(ctx);
        }
    }

    drawFallback(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.facingRight ? 0 : -this.size,
            0,
            this.size,
            this.size
        );
    }

    drawHealthBar(ctx) {
        ctx.fillStyle = "black";
        ctx.fillRect(this.x, this.y - 10, this.size, 5);
        ctx.fillStyle = "green";
        ctx.fillRect(this.x, this.y - 10, (this.health / this.maxHealth) * this.size, 5);
    }

    drawBurningEffect(ctx) {
        ctx.fillStyle = `rgba(255, ${Math.random() * 100}, 0, 0.5)`;
        ctx.beginPath();
        ctx.arc(this.x + this.size / 2, this.y - 15, 6, 0, Math.PI * 2);
        ctx.fill();
    }
}