import {BULLET_RADIUS, GUN_LENGTH, MAX_HEALTH, PLAYER_RADIUS} from './constants.js';

export class Renderer {
    constructor(ctx, camera) {
        this.ctx = ctx;
        this.camera = camera;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    drawBackground() {
        this.ctx.fillStyle = '#e0e0e0';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    drawWalls(walls) {
        const baseColor = 160;
        const shadeDarkness = 40;
        const perspective = 0.5;
        const wallHeight = 50;

        for (let wall of walls) {
            // Check if the wall is within the camera view
            const wallX = wall.x - this.camera.x;
            const wallY = wall.y - this.camera.y;

            if (wallX + wall.width > 0 && wallX < this.ctx.canvas.width &&
                wallY + wall.height > 0 && wallY < this.ctx.canvas.height) {

                // Calculate damage effect
                const damageEffect = (3 - wall.health) * 30;
                const frontFaceColor = baseColor - shadeDarkness * 2 - damageEffect;

                // Front face
                this.ctx.fillStyle = `rgb(${frontFaceColor}, ${frontFaceColor}, ${frontFaceColor})`;
                this.ctx.beginPath();
                this.ctx.moveTo(wallX, wallY);
                this.ctx.lineTo(wallX, wallY + wall.height);
                this.ctx.lineTo(wallX + wall.width, wallY + wall.height);
                this.ctx.lineTo(wallX + wall.width, wallY);
                this.ctx.closePath();
                this.ctx.fill();

                // Draw cracks for damage
                if (wall.health < 3) {
                    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                    this.ctx.lineWidth = 2;
                    const crackCount = 4 - wall.health;
                    for (let i = 0; i < crackCount; i++) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(wallX + Math.random() * wall.width, wallY);
                        this.ctx.lineTo(wallX + Math.random() * wall.width, wallY + wall.height);
                        this.ctx.stroke();
                    }
                }
            }
        }
    }

    drawPlayers(players, clientId) {
        for (let id in players) {
            const player = players[id];
            if (player.x !== undefined && player.y !== undefined) {
                this.drawPlayer(player, id === clientId);
            }
        }
    }

    drawPlayer(player, isCurrentPlayer) {
        const screenX = player.x - this.camera.x;
        const screenY = player.y - this.camera.y;

        // Only draw if the player is within the visible area
        if (screenX >= -PLAYER_RADIUS && screenX <= this.ctx.canvas.width + PLAYER_RADIUS &&
            screenY >= -PLAYER_RADIUS && screenY <= this.ctx.canvas.height + PLAYER_RADIUS) {

            this.ctx.save();
            this.ctx.translate(screenX, screenY);
            this.ctx.rotate(player.angle);

            if (isCurrentPlayer) {
                this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                this.ctx.shadowBlur = 5;
                this.ctx.shadowOffsetX = 2;
                this.ctx.shadowOffsetY = 2;
            }

            // Draw player body
            this.ctx.beginPath();
            this.ctx.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
            this.ctx.fillStyle = isCurrentPlayer ? 'blue' : 'red';
            this.ctx.fill();

            // Draw "gun"
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(GUN_LENGTH, 0);
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            // Draw muzzle flash
            if (player.flashTimer > 0) {
                this.ctx.beginPath();
                this.ctx.moveTo(GUN_LENGTH, 0);
                this.ctx.lineTo(GUN_LENGTH + 10, -5);
                this.ctx.lineTo(GUN_LENGTH + 20, 0);
                this.ctx.lineTo(GUN_LENGTH + 10, 5);
                this.ctx.fillStyle = 'yellow';
                this.ctx.fill();
            }

            this.ctx.restore();

            // Draw health bar
            const healthBarWidth = PLAYER_RADIUS * 2;
            const healthBarHeight = 5;
            this.ctx.fillStyle = 'red';
            this.ctx.fillRect(screenX - PLAYER_RADIUS, screenY - PLAYER_RADIUS - 10, healthBarWidth, healthBarHeight);
            this.ctx.fillStyle = 'green';
            this.ctx.fillRect(screenX - PLAYER_RADIUS, screenY - PLAYER_RADIUS - 10, healthBarWidth * (player.health / MAX_HEALTH), healthBarHeight);

            if (player.emote) {
                this.ctx.fillStyle = 'black';
                this.ctx.font = '12px Arial';
                this.ctx.fillText(player.emote, screenX, screenY - 40);
            }
        }
    }

    drawBullets(bullets) {
        this.ctx.fillStyle = 'red';
        for (let bullet of bullets) {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x - this.camera.x, bullet.y - this.camera.y, BULLET_RADIUS, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }

    generatePlayerSvg(health) {
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 40 40");

        // Calculate color based on health
        const hue = (health / MAX_HEALTH) * 120; // 120 is green, 0 is red
        const color = `hsl(${hue}, 100%, 50%)`;

        const body = document.createElementNS(svgNS, "square");
        body.setAttribute("fill", color);
        svg.appendChild(body);

        const svgString = new XMLSerializer().serializeToString(svg);
        const img = new Image();
        img.src = "data:image/svg+xml;base64," + btoa(svgString);
        return img;
    }
}