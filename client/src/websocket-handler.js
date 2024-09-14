export class WebSocketHandler {
    constructor(game) {
        this.game = game;
        this.ws = new WebSocket(`ws://${window.location.host}/ws/${game.clientId}`);
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'init':
                    this.handleInit(data);
                    break;
                case 'move':
                    this.handleMove(data);
                    break;
                case 'throw':
                    this.handleThrow(data);
                    break;
                case 'updateBullets':
                    this.game.bulletManager.updateBullets(data.bullets);
                    break;
                case 'updateWalls':
                    this.game.wallManager.updateWalls(data.walls);
                    break;
                case 'emote':
                    this.handleEmote(data);
                    break;
                case 'disconnect':
                    this.game.playerManager.removePlayer(data.client_id);
                    break;
                case 'hit':
                    this.game.playerManager.updatePlayerHealth(data.client_id, data.health);
                    break;
                case 'respawn':
                    this.game.playerManager.respawnPlayer(data.client_id, data.x, data.y, data.health);
                    break;
            }
        };
    }

    handleInit(data) {
        this.game.playerManager.setPlayers(data.players);
        this.game.wallManager.setWalls(data.walls);
        this.game.WORLD_WIDTH = data.world_width;
        this.game.WORLD_HEIGHT = data.world_height;
        this.game.resizeCanvas();
    }

    handleMove(data) {
        if (data.client_id !== this.game.clientId) {
            this.game.playerManager.updatePlayerPosition(data.client_id, data.x, data.y, data.angle);
        }
    }

    handleThrow(data) {
        this.game.bulletManager.addBullet(data.bullet);
        if (data.client_id === this.game.clientId) {
            this.game.playerManager.setPlayerFlashTimer(this.game.clientId);
        }
    }

    handleEmote(data) {
        this.game.playerManager.setPlayerEmote(data.client_id, data.emote);
    }

    sendMove(x, y, angle) {
        this.ws.send(JSON.stringify({type: 'move', x, y, angle}));
    }

    sendThrow(x, y, angle) {
        this.ws.send(JSON.stringify({type: 'throw', x, y, angle}));
    }

    sendEmote(emote) {
        this.ws.send(JSON.stringify({type: 'emote', emote}));
    }
}