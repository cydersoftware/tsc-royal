import {FLASH_DURATION, INTERPOLATION_DELAY} from './constants.js';
import {lerp} from './utils.js';

export class PlayerManager {
    constructor(clientId) {
        this.clientId = clientId;
        this.players = {};
    }

    setPlayers(players) {
        this.players = players;
    }

    updatePlayerPosition(id, x, y, angle) {
        if (!this.players[id]) {
            this.players[id] = {x, y, angle};
        }
        this.players[id].prevX = this.players[id].x;
        this.players[id].prevY = this.players[id].y;
        this.players[id].serverX = x;
        this.players[id].serverY = y;
        this.players[id].angle = angle;
        this.players[id].lastUpdate = performance.now();
    }

    interpolatePlayerPositions(currentTime) {
        for (let id in this.players) {
            if (id !== this.clientId && this.players[id].serverX !== undefined) {
                const t = Math.min(1, (currentTime - this.players[id].lastUpdate) / INTERPOLATION_DELAY);
                this.players[id].x = lerp(this.players[id].prevX, this.players[id].serverX, t);
                this.players[id].y = lerp(this.players[id].prevY, this.players[id].serverY, t);
            }
        }
    }

    setPlayerFlashTimer(id) {
        this.players[id].flashTimer = FLASH_DURATION;
    }

    setPlayerEmote(id, emote) {
        this.players[id].emote = emote;
        setTimeout(() => {
            this.players[id].emote = null;
        }, 2000);
    }

    removePlayer(id) {
        delete this.players[id];
    }

    updatePlayerHealth(id, health) {
        this.players[id].health = health;
    }

    respawnPlayer(id, x, y, health) {
        this.players[id] = {
            x: x,
            y: y,
            health: health
        };
    }
}