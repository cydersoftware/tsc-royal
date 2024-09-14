import {WebSocketHandler} from './websocket-handler.js';
import {PlayerManager} from './player-manager.js';
import {BulletManager} from './bullet-manager.js';
import {WallManager} from './wall-manager.js';
import {Camera} from './camera.js';
import {InputHandler} from './input-handler.js';
import {Renderer} from './renderer.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.emoteSelect = document.getElementById('emote-select');

        this.clientId = Math.floor(Math.random() * 1000);
        this.WORLD_WIDTH = 0;
        this.WORLD_HEIGHT = 0;

        this.playerManager = new PlayerManager();
        this.bulletManager = new BulletManager();
        this.wallManager = new WallManager();
        this.camera = new Camera();
        this.inputHandler = new InputHandler(this);
        this.renderer = new Renderer(this.ctx, this.camera);

        this.webSocketHandler = new WebSocketHandler(this);

        this.lastUpdateTime = 0;

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.emoteSelect.addEventListener('change', (e) => {
            this.webSocketHandler.sendEmote(e.target.value);
        });
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    gameLoop(currentTime) {
        if (this.lastUpdateTime === 0) this.lastUpdateTime = currentTime;
        const deltaTime = currentTime - this.lastUpdateTime;

        this.update(deltaTime, currentTime);
        this.render();

        this.lastUpdateTime = currentTime;
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime, currentTime) {
        this.inputHandler.updatePlayerPosition();
        this.playerManager.interpolatePlayerPositions(currentTime);
    }

    render() {
        this.renderer.clear();
        this.renderer.drawBackground();
        this.renderer.drawWalls(this.wallManager.walls);
        this.renderer.drawPlayers(this.playerManager.players, this.clientId);
        this.renderer.drawBullets(this.bulletManager.bullets);
    }
}

const game = new Game();