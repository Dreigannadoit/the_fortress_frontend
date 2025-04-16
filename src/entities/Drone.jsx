// Helper function (ensure this exists, e.g., in a utils.js file)
const lerp = (a, b, t) => {
    return a + (b - a) * t;
};

export default class Drone {
    static globalOrbitAngle = 0;
    static lastUpdate = 0;
    static drones = [];
    static droneSeparationDistance = 90; // *** Minimum distance between drones ***

    constructor(player) {
        this.player = player;
        Drone.drones.push(this);
        this.id = `drone_${Math.random().toString(36).substring(2, 9)}`; // Unique ID

        // --- Movement & Positioning ---
        this.x = player.x;
        this.y = player.y;
        this.orbitRadius = 60; // Slightly increased orbit radius
        this.orbitAngleOffset = 0;
        this.maxDistanceFromPlayer = 400;
        this.smoothingFactor = 0.06; // Might need adjustment for larger distances
        this.size = 8;

        // --- Attack ---
        this.targetEnemy = null;
        this.attackRange = 300;           // Max distance to acquire a target (increased slightly)
        this.attackEngageDistance = 150; // Distance to start actively positioning for attack (increased)
        this.attackHoverDistance = 90;    // *** The desired distance to maintain from enemy ***
        this.fireRate = 500; // ms
        this.lastShot = 0;

        // --- Separation ---
        // this.separationFactor removed as we use a fixed distance now
        this.separationStrength = 0.1;  // Increased strength for larger distance separation
    }

    update(player, enemies, bullets) {
        const now = Date.now();
        if (now - Drone.lastUpdate > 16) {
            Drone.globalOrbitAngle += 0.02;
            Drone.lastUpdate = now;
        }

        this.recalculateOrbitOffset();
        const playerPos = player.getPosition();

        // --- Improved Target Validation ---
        const currentEnemyInvalid = !this.targetEnemy ||
            this.targetEnemy.isDead ||
            !enemies.includes(this.targetEnemy) || // Ensure enemy still exists
            this.distanceTo(this.targetEnemy) > this.attackRange;

        if (currentEnemyInvalid) {
            this.targetEnemy = this.findBestEnemyToTarget(enemies);
        }

        let targetX = this.x;
        let targetY = this.y;

        if (this.targetEnemy) {
            const enemyPos = this.targetEnemy;
            const distanceToEnemy = this.distanceTo(enemyPos);

            // Calculate desired position
            const angleFromEnemy = Math.atan2(this.y - enemyPos.y, this.x - enemyPos.x);
            const desiredX = enemyPos.x + Math.cos(angleFromEnemy) * this.attackHoverDistance;
            const desiredY = enemyPos.y + Math.sin(angleFromEnemy) * this.attackHoverDistance;

            // Always move towards attack position
            targetX = desiredX;
            targetY = desiredY;

            // Shooting logic
            if (Math.abs(distanceToEnemy - this.attackHoverDistance) < 30 &&
                now - this.lastShot > this.fireRate) {
                this.shoot(bullets);
                this.lastShot = now;
            }
        } else {
            // Return to orbit position
            const orbitTargetX = playerPos.x + Math.cos(Drone.globalOrbitAngle + this.orbitAngleOffset) * this.orbitRadius;
            const orbitTargetY = playerPos.y + Math.sin(Drone.globalOrbitAngle + this.orbitAngleOffset) * this.orbitRadius;
            targetX = orbitTargetX;
            targetY = orbitTargetY;
        }

        // --- Movement & Constraints ---
        this.x = lerp(this.x, targetX, this.smoothingFactor);
        this.y = lerp(this.y, targetY, this.smoothingFactor);
        this.applyLeash(playerPos);
        this.applySeparation();
    }

    // Enhanced target finding
    findBestEnemyToTarget(enemies) {
        // Filter valid targets first
        const validEnemies = enemies.filter(enemy =>
            !enemy.isDead &&
            this.distanceTo(enemy) <= this.attackRange
        );

        if (validEnemies.length === 0) return null;

        // Find nearest untargeted enemy
        const targetedEnemyIds = new Set(
            Drone.drones
                .filter(d => d !== this && d.targetEnemy)
                .map(d => d.targetEnemy.id)
        );

        // Prioritize untargeted enemies
        const bestEnemy = validEnemies.reduce((best, current) => {
            const currentDistance = this.distanceTo(current);
            const currentIsTargeted = targetedEnemyIds.has(current.id);

            if (!best) return { enemy: current, distance: currentDistance, targeted: currentIsTargeted };

            // Prefer untargeted enemies
            if (currentIsTargeted !== best.targeted) {
                return currentIsTargeted ? best : { enemy: current, distance: currentDistance, targeted: currentIsTargeted };
            }

            // If same targeted status, choose closer
            return currentDistance < best.distance ?
                { enemy: current, distance: currentDistance, targeted: currentIsTargeted } :
                best;
        }, null);

        return bestEnemy?.enemy || null;
    }

    applyLeash(playerPos) {
        const distanceToPlayer = this.distanceTo(playerPos);
        if (distanceToPlayer > this.maxDistanceFromPlayer) {
            const angleToPlayer = Math.atan2(playerPos.y - this.y, playerPos.x - this.x);
            const pullStrength = (distanceToPlayer - this.maxDistanceFromPlayer) * 0.02; // Stronger pull
            // Apply pull directly, lerp handles the smoothing
            this.x += Math.cos(angleToPlayer) * pullStrength;
            this.y += Math.sin(angleToPlayer) * pullStrength;
        }
    }

    applySeparation() {
        let totalPushX = 0;
        let totalPushY = 0;

        Drone.drones.forEach(otherDrone => {
            if (otherDrone === this) return;

            const dx = this.x - otherDrone.x;
            const dy = this.y - otherDrone.y;
            const distance = Math.hypot(dx, dy);

            // Use the static separation distance
            if (distance > 0 && distance < Drone.droneSeparationDistance) {
                const overlap = Drone.droneSeparationDistance - distance;
                const pushX = (dx / distance) * overlap * this.separationStrength;
                const pushY = (dy / distance) * overlap * this.separationStrength;
                totalPushX += pushX;
                totalPushY += pushY;
            }
        });

        // Apply the accumulated separation push
        // Adding directly might feel more responsive for separation than lerping it
        this.x += totalPushX;
        this.y += totalPushY;
    }

    recalculateOrbitOffset() {
        const index = Drone.drones.findIndex(d => d.id === this.id); // Use ID for safety
        const total = Drone.drones.length;
        if (index !== -1 && total > 0) {
            this.orbitAngleOffset = (2 * Math.PI * index) / total;
        }
    }

    distanceTo(target) {
        if (typeof target?.x !== 'number' || typeof target?.y !== 'number') {
            return Infinity;
        }
        return Math.hypot(target.x - this.x, target.y - this.y);
    }

    shoot(bullets) {
        if (!this.targetEnemy) return;

        const angle = Math.atan2(
            this.targetEnemy.y - this.y,
            this.targetEnemy.x - this.x
        );

        bullets.push({
            // ... (same bullet properties as before)
            x: this.x,
            y: this.y,
            size: 5,
            velocity: { x: Math.cos(angle) * 8, y: Math.sin(angle) * 8 },
            damage: 25,
            type: 'drone_bullet',
            owner: 'player',
            piercing: 0,
            duration: 5000,
            spawnTime: Date.now(),
        });
    }

    destroy() {
        // Ensure target is cleared if this drone is destroyed while targeting
        // (though the target finding logic should handle this eventually)
        this.targetEnemy = null;

        const index = Drone.drones.findIndex(d => d.id === this.id);
        if (index !== -1) {
            Drone.drones.splice(index, 1);
        }
        console.log(`Drone ${this.id} destroyed. Remaining: ${Drone.drones.length}`);
    }

    draw(ctx) {
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();


        // Debug drawing
        if (this.targetEnemy) {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo((this.targetEnemy.x + 10), (this.targetEnemy.y + 10));
            ctx.stroke();

            // ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
            // ctx.beginPath();
            // ctx.arc(this.targetEnemy.x, this.targetEnemy.y, this.attackHoverDistance, 0, Math.PI * 2);
            // ctx.stroke();
        }

        // --- Debug Drawing (Optional, very helpful for tuning) ---

        /*
        // Draw target line
        if (this.targetEnemy) {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)'; // Red line to enemy
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.targetEnemy.x, this.targetEnemy.y);
            ctx.stroke();
        }
    
        // Draw circle for attackHoverDistance around ENEMY
        if (this.targetEnemy) {
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)'; // Green circle around enemy
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.targetEnemy.x, this.targetEnemy.y, this.attackHoverDistance, 0, Math.PI * 2);
            ctx.stroke();
        }
    
        // Draw circle for Drone Separation around THIS drone
        ctx.strokeStyle = 'rgba(0, 0, 255, 0.1)'; // Blue circle around drone
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Drone.droneSeparationDistance, 0, Math.PI * 2);
        ctx.stroke();
        */

    }
}