const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const emoteSelect = document.getElementById('emote-select');

let clientId = Math.floor(Math.random() * 1000);
let players = {};
let bullets = [];
let walls = [];
let camera = { x: 0, y: 0 };
let playerSvg;

let WORLD_WIDTH, WORLD_HEIGHT;
const PLAYER_SPEED = 5;
const PLAYER_RADIUS = 20;
const BULLET_SPEED = 10;
const BULLET_RADIUS = 5;
const MAX_HEALTH = 100;
const GUN_LENGTH = 30; // Length of the "gun" extending from the player
const FLASH_DURATION = 100; // Duration of muzzle flash in milliseconds

const ws = new WebSocket(`ws://${window.location.host}/ws/${clientId}`);

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
        case 'init':
            players = data.players;
            // Initialize angle and flashTimer for each player
            for (let id in players) {
                players[id].angle = players[id].angle || 0;
                players[id].flashTimer = 0;
            }
            walls = data.walls;
            WORLD_WIDTH = data.world_width;
            WORLD_HEIGHT = data.world_height;
            resizeCanvas();
            break;
        case 'move':
            if (!players[data.client_id]) {
                players[data.client_id] = {};
            }
            players[data.client_id].x = data.x;
            players[data.client_id].y = data.y;
            players[data.client_id].angle = data.angle;
            break;
        case 'throw':
            bullets.push(data.bullet);
            if (data.client_id === clientId) {
                players[clientId].flashTimer = FLASH_DURATION;
            }
            break;
        case 'updateBullets':
            bullets = data.bullets;
            break;
        case 'updateWalls':
            walls = data.walls;
            break;
        case 'emote':
            players[data.client_id].emote = data.emote;
            setTimeout(() => {
                players[data.client_id].emote = null;
            }, 2000);
            break;
        case 'disconnect':
            delete players[data.client_id];
            break;
        case 'hit':
            players[data.client_id].health = data.health;
            break;
        case 'respawn':
            players[data.client_id] = {
                x: data.x,
                y: data.y,
                health: data.health
            };
            break;
    }
};

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);

function generatePlayerSvg(health) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 40 40");

    // Calculate color based on health
    const hue = (health / MAX_HEALTH) * 120; // 120 is green, 0 is red
    const color = `hsl(${hue}, 100%, 50%)`;

    const body = document.createElementNS(svgNS, "circle");
    body.setAttribute("cx", "20");
    body.setAttribute("cy", "20");
    body.setAttribute("r", "18");
    body.setAttribute("fill", color);
    body.setAttribute("stroke", "#2980b9");
    body.setAttribute("stroke-width", "2");

    const leftEye = document.createElementNS(svgNS, "circle");
    leftEye.setAttribute("cx", "15");
    leftEye.setAttribute("cy", "15");
    leftEye.setAttribute("r", "3");
    leftEye.setAttribute("fill", "white");

    const rightEye = document.createElementNS(svgNS, "circle");
    rightEye.setAttribute("cx", "25");
    rightEye.setAttribute("cy", "15");
    rightEye.setAttribute("r", "3");
    rightEye.setAttribute("fill", "white");

    const mouth = document.createElementNS(svgNS, "path");
    mouth.setAttribute("d", "M13 25 Q20 30 27 25");
    mouth.setAttribute("stroke", "#2980b9");
    mouth.setAttribute("stroke-width", "2");
    mouth.setAttribute("fill", "none");

    svg.appendChild(body);
    svg.appendChild(leftEye);
    svg.appendChild(rightEye);
    svg.appendChild(mouth);

    const svgString = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.src = "data:image/svg+xml;base64," + btoa(svgString);
    return img;
}

function updatePlayerPosition() {
    if (!players[clientId]) return;

    let dx = 0;
    let dy = 0;

    if (keys['ArrowLeft']) dx -= PLAYER_SPEED;
    if (keys['ArrowRight']) dx += PLAYER_SPEED;
    if (keys['ArrowUp']) dy -= PLAYER_SPEED;
    if (keys['ArrowDown']) dy += PLAYER_SPEED;

    if (dx !== 0 || dy !== 0) {
        const newX = Math.max(PLAYER_RADIUS, Math.min(WORLD_WIDTH - PLAYER_RADIUS, players[clientId].x + dx));
        const newY = Math.max(PLAYER_RADIUS, Math.min(WORLD_HEIGHT - PLAYER_RADIUS, players[clientId].y + dy));

        // Calculate new angle
        players[clientId].angle = Math.atan2(dy, dx);

        // Check collision with walls
        if (!checkWallCollision(newX, newY)) {
            ws.send(JSON.stringify({ type: 'move', x: newX, y: newY, angle: players[clientId].angle }));
        }
    }

    // Update camera position
    camera.x = players[clientId].x - canvas.width / 2;
    camera.y = players[clientId].y - canvas.height / 2;

    // Clamp camera to world bounds
    camera.x = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, camera.x));
    camera.y = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, camera.y));
}
function checkWallCollision(x, y) {
    for (let wall of walls) {
        if (x + PLAYER_RADIUS > wall.x && x - PLAYER_RADIUS < wall.x + wall.width &&
            y + PLAYER_RADIUS > wall.y && y - PLAYER_RADIUS < wall.y + wall.height) {
            return true; // Collision detected
        }
    }
    return false; // No collision
}

function drawWalls() {
    for (let wall of walls) {
        if (wall.x - camera.x + wall.width > 0 &&
            wall.x - camera.x < canvas.width &&
            wall.y - camera.y + wall.height > 0 &&
            wall.y - camera.y < canvas.height) {

            const wallHeight = 50;
            const perspective = 0.5;

            const baseColor = 160;
            const shadeDarkness = 40;
            const damageEffect = (3 - wall.health) * 30;

            // Top face
            ctx.fillStyle = `rgb(${baseColor - damageEffect}, ${baseColor - damageEffect}, ${baseColor - damageEffect})`;
            ctx.beginPath();
            ctx.moveTo(wall.x - camera.x, wall.y - camera.y);
            ctx.lineTo(wall.x - camera.x + wall.width, wall.y - camera.y);
            ctx.lineTo(wall.x - camera.x + wall.width - wallHeight * perspective, wall.y - camera.y - wallHeight);
            ctx.lineTo(wall.x - camera.x - wallHeight * perspective, wall.y - camera.y - wallHeight);
            ctx.closePath();
            ctx.fill();

            // Right face (lighter)
            ctx.fillStyle = `rgb(${baseColor - shadeDarkness - damageEffect}, ${baseColor - shadeDarkness - damageEffect}, ${baseColor - shadeDarkness - damageEffect})`;
            ctx.beginPath();
            ctx.moveTo(wall.x - camera.x + wall.width, wall.y - camera.y);
            ctx.lineTo(wall.x - camera.x + wall.width, wall.y - camera.y + wall.height);
            ctx.lineTo(wall.x - camera.x + wall.width - wallHeight * perspective, wall.y - camera.y + wall.height - wallHeight);
            ctx.lineTo(wall.x - camera.x + wall.width - wallHeight * perspective, wall.y - camera.y - wallHeight);
            ctx.closePath();
            ctx.fill();

            // Front face
            ctx.fillStyle = `rgb(${baseColor - shadeDarkness*2 - damageEffect}, ${baseColor - shadeDarkness*2 - damageEffect}, ${baseColor - shadeDarkness*2 - damageEffect})`;
            ctx.beginPath();
            ctx.moveTo(wall.x - camera.x, wall.y - camera.y);
            ctx.lineTo(wall.x - camera.x, wall.y - camera.y + wall.height);
            ctx.lineTo(wall.x - camera.x + wall.width, wall.y - camera.y + wall.height);
            ctx.lineTo(wall.x - camera.x + wall.width, wall.y - camera.y);
            ctx.closePath();
            ctx.fill();

            // Draw cracks to represent damage
            if (wall.health < 3) {
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.lineWidth = 2;
                const crackCount = 4 - wall.health;
                for (let i = 0; i < crackCount; i++) {
                    ctx.beginPath();
                    ctx.moveTo(wall.x - camera.x + Math.random() * wall.width, wall.y - camera.y);
                    ctx.lineTo(wall.x - camera.x + Math.random() * wall.width, wall.y - camera.y + wall.height);
                    ctx.stroke();
                }
            }
        }
    }
}

function drawPlayer(player, id) {
    const isCurrentPlayer = id == clientId;
    ctx.save();
    ctx.translate(player.x - camera.x, player.y - camera.y);
    ctx.rotate(player.angle);

    if (isCurrentPlayer) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
    }

    // Generate player SVG based on current health
    const playerImg = generatePlayerSvg(player.health);
    ctx.drawImage(playerImg, -PLAYER_RADIUS, -PLAYER_RADIUS, PLAYER_RADIUS * 2, PLAYER_RADIUS * 2);

    // Draw "gun"
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(GUN_LENGTH, 0);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw muzzle flash
    if (player.flashTimer > 0) {
        ctx.beginPath();
        ctx.moveTo(GUN_LENGTH, 0);
        ctx.lineTo(GUN_LENGTH + 10, -5);
        ctx.lineTo(GUN_LENGTH + 20, 0);
        ctx.lineTo(GUN_LENGTH + 10, 5);
        ctx.fillStyle = 'yellow';
        ctx.fill();
    }

    // Draw health bar
    ctx.rotate(-player.angle); // Rotate back to draw health bar horizontally
    const healthBarWidth = PLAYER_RADIUS * 2;
    const healthBarHeight = 5;
    ctx.fillStyle = 'red';
    ctx.fillRect(-PLAYER_RADIUS, -PLAYER_RADIUS - 10, healthBarWidth, healthBarHeight);
    ctx.fillStyle = 'green';
    ctx.fillRect(-PLAYER_RADIUS, -PLAYER_RADIUS - 10, healthBarWidth * (player.health / MAX_HEALTH), healthBarHeight);

    ctx.restore();

    if (player.emote) {
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.fillText(player.emote, player.x - camera.x, player.y - camera.y - 40);
    }
}

function drawBullet(bullet) {
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(bullet.x - camera.x, bullet.y - camera.y, BULLET_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
}

function updateGame() {
    updatePlayerPosition();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawWalls();

    // Draw players
    for (let id in players) {
        drawPlayer(players[id], id);
        if (players[id].flashTimer > 0) {
            players[id].flashTimer -= 16; // Assume 60 FPS, so each frame is about 16ms
        }
    }

    // Draw bullets
    for (let bullet of bullets) {
        drawBullet(bullet);
    }

    requestAnimationFrame(updateGame);
}

const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.code === 'Space' && players[clientId]) {
        const player = players[clientId];
        const bulletStartX = player.x + Math.cos(player.angle) * GUN_LENGTH;
        const bulletStartY = player.y + Math.sin(player.angle) * GUN_LENGTH;
        ws.send(JSON.stringify({
            type: 'throw',
            x: bulletStartX,
            y: bulletStartY,
            angle: player.angle
        }));
        player.flashTimer = FLASH_DURATION;
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

emoteSelect.addEventListener('change', (e) => {
    ws.send(JSON.stringify({ type: 'emote', emote: e.target.value }));
});

ws.onopen = () => {
    playerSvg = generatePlayerSvg(MAX_HEALTH);

    playerSvg.onload = () => {
        updateGame();
    };
};


// Prevent default behavior for arrow keys to avoid scrolling
window.addEventListener('keydown', function(e) {
    if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(e.code) > -1) {
        e.preventDefault();
    }
}, false);

// Initial canvas resize
resizeCanvas();