export default class Particle {
    constructor(x, y, color = '#f00') { // Default to red if no color provided
        this.x = x;
        this.y = y;
        this.size = Math.random() * 8 + 4; // Larger particles
        this.baseSize = this.size;
        this.color = color;
        
        // More dramatic initial velocity
        this.velocity = {
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 10
        };
        
        this.gravity = 0.2;
        this.friction = 0.95;
        this.life = 60; // Longer lifespan
        this.decay = Math.random() * 2 + 1;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    }

    update() {
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.velocity.y += this.gravity;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.rotation += this.rotationSpeed;
        this.life -= this.decay;
        
        // Shrink over time
        this.size = this.baseSize * (this.life / 60);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Main blood cube
        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.min(1, this.life / 30); // Fade out in last half of life
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        
        // Highlight for better visibility
        ctx.fillStyle = `rgba(255, 100, 100, ${this.life / 120})`;
        ctx.fillRect(-this.size/3, -this.size/3, this.size/2, this.size/2);
        
        ctx.restore();
    }

    isAlive() {
        return this.life > 0;
    }
}