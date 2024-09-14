export class WallManager {
    constructor() {
        this.walls = [];
    }

    setWalls(walls) {
        this.walls = walls;
    }

    updateWalls(newWalls) {
        this.walls = newWalls;
    }
}