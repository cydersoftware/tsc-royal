export class BulletManager {
    constructor() {
        this.bullets = [];
    }

    addBullet(bullet) {
        this.bullets.push(bullet);
    }

    updateBullets(newBullets) {
        this.bullets = newBullets;
    }
}