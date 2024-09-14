export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
    }

    update(playerX, playerY, canvasWidth, canvasHeight, worldWidth, worldHeight) {
        this.x = playerX - canvasWidth / 2;
        this.y = playerY - canvasHeight / 2;

        // Clamp camera to world bounds
        this.x = Math.max(0, Math.min(worldWidth - canvasWidth, this.x));
        this.y = Math.max(0, Math.min(worldHeight - canvasHeight, this.y));
    }
}