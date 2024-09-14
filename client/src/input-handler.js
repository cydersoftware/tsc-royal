import {GUN_LENGTH, PLAYER_RADIUS, PLAYER_SPEED} from './constants.js';

export class InputHandler {
    constructor(game) {
        this.game = game;
        this.keys = {};
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.code === 'Space' && this.game.playerManager.players[this.game.clientId]) {
                this.handleSpaceBar();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // Prevent default behavior for arrow keys to avoid scrolling
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(e.code) > -1) {
                e.preventDefault();
            }
        }, false);
    }

    handleSpaceBar() {
        const player = this.game.playerManager.players[this.game.clientId];
        const bulletStartX = player.x + Math.cos(player.angle) * GUN_LENGTH;
        const bulletStartY = player.y + Math.sin(player.angle) * GUN_LENGTH;
        this.game.webSocketHandler.sendThrow(bulletStartX, bulletStartY, player.angle);
    }

    updatePlayerPosition() {
        const player = this.game.playerManager.players[this.game.clientId];
        if (!player) return;

        let dx = 0;
        let dy = 0;

        if (this.keys['ArrowLeft']) dx -= PLAYER_SPEED;
        if (this.keys['ArrowRight']) dx += PLAYER_SPEED;
        if (this.keys['ArrowUp']) dy -= PLAYER_SPEED;
        if (this.keys['ArrowDown']) dy += PLAYER_SPEED;

        if (dx !== 0 || dy !== 0) {
            const newX = Math.max(PLAYER_RADIUS, Math.min(this.game.WORLD_WIDTH - PLAYER_RADIUS, player.x + dx));
            const newY = Math.max(PLAYER_RADIUS, Math.min(this.game.WORLD_HEIGHT - PLAYER_RADIUS, player.y + dy));

            // Calculate new angle
            player.angle = Math.atan2(dy, dx);

            // Check collision with walls
            if (!this.checkWallCollision(newX, newY)) {
                // Update local position immediately for responsiveness
                player.x = newX;
                player.y = newY;

                // Send update to server
                this.game.webSocketHandler.sendMove(newX, newY, player.angle);
            }
        }

        // Update camera position
        this.game.camera.update(player.x, player.y, this.game.canvas.width, this.game.canvas.height, this.game.WORLD_WIDTH, this.game.WORLD_HEIGHT);
    }

    checkWallCollision(x, y) {
        for (let wall of this.game.wallManager.walls) {
            if (x + PLAYER_RADIUS > wall.x && x - PLAYER_RADIUS < wall.x + wall.width &&
                y + PLAYER_RADIUS > wall.y && y - PLAYER_RADIUS < wall.y + wall.height) {
                return true; // Collision detected
            }
        }
        return false; // No collision
    }
}