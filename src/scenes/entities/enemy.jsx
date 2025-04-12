import { getScaledValue } from "../../utils/getScaledValue";
import { ENEMY_TYPES  } from "../constants";

export class Enemy {
    constructor(x, y, type) {
        const config = ENEMY_TYPES[type] || ENEMY_TYPES.normal;

        this.x = x;
        this.y = y;
        this.type = type;
        this.size = getScaledValue(config.size);
        this.speed = getScaledValue(config.speed);
        this.velocity = { x: 0, y: 0 };
        this.health = config.health;
        this.maxHealth = config.health;
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
    }

    update(player, canvas, lineY) {
        // Apply velocity and friction
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.x *= 0.9;
        this.velocity.y *= 0.9;

        const maxY = lineY - this.size;

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
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
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

    takeDamage(damage, knockbackForce = 0, angle = 0) {
        this.health -= damage;

        // Apply knockback with resistance
        const effectiveKnockback = knockbackForce * (1 - this.knockbackResistance);
        if (effectiveKnockback > 0) {
            this.velocity.x += Math.cos(angle) * effectiveKnockback;
            this.velocity.y += Math.sin(angle) * effectiveKnockback;
        }

        if (this.health <= 0) {
            if (this.damageInterval) clearInterval(this.damageInterval);
            return true; // Enemy killed
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

    draw(ctx) {
        // Main body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);

        // Health bar
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x, this.y - 10, this.size, 5);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x, this.y - 10, (this.health / this.maxHealth) * this.size, 5);

        // Burning effect
        if (this.isBurning) {
            ctx.fillStyle = `rgba(255, ${Math.random() * 100}, 0, 0.5)`;
            ctx.beginPath();
            ctx.arc(this.x + this.size / 2, this.y - 15, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}