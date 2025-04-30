export class Item {
    constructor(x, y, type, effect) {
        this.x = x;
        this.y = y;
        this.type = type; // 'medkit', 'ammo', etc.
        this.effect = effect; // Function to apply when collected
        this.size = 30;
        this.collected = false;
        this.sprite = null;
        this.lifespan = 15000; // 15 seconds before disappearing
        this.spawnTime = Date.now();
    }

    update() {
        // Check if item has expired
        if (Date.now() - this.spawnTime > this.lifespan) {
            this.collected = true;
        }
    }

    draw(ctx) {
        if (this.collected) return;
        
        // Draw different visuals based on item type
        switch(this.type) {
            case 'medkit':
                // Red cross on white background
                ctx.fillStyle = 'white';
                ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
                ctx.fillStyle = 'red';
                // Vertical bar
                ctx.fillRect(this.x - this.size/6, this.y - this.size/2, this.size/3, this.size);
                // Horizontal bar
                ctx.fillRect(this.x - this.size/2, this.y - this.size/6, this.size, this.size/3);
                break;
            // Add more item types here
            default:
                // Default item (green square)
                ctx.fillStyle = 'green';
                ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        }
    }
}