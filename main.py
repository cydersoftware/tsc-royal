from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.requests import Request
import json
import random
import asyncio
import math

app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Set up Jinja2 templates
templates = Jinja2Templates(directory="templates")

# Store connected clients
clients = {}

# World size
WORLD_WIDTH = 3000
WORLD_HEIGHT = 3000

# Grid size
GRID_SIZE = 150
WALL_THICKNESS = 10

# Game state
players = {}
bullets = []
walls = []

# Constants
BULLET_SPEED = 10
BULLET_RADIUS = 5
WALL_MAX_HEALTH = 3
PLAYER_RADIUS = 20


def generate_maze():
    grid_width = WORLD_WIDTH // GRID_SIZE
    grid_height = WORLD_HEIGHT // GRID_SIZE

    # Initialize grid
    grid = [[1 for _ in range(grid_width)] for _ in range(grid_height)]

    def carve_path(x, y):
        grid[y][x] = 0
        directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]
        random.shuffle(directions)

        for dx, dy in directions:
            nx, ny = x + dx * 2, y + dy * 2
            if 0 <= nx < grid_width and 0 <= ny < grid_height and grid[ny][nx] == 1:
                grid[y + dy][x + dx] = 0
                carve_path(nx, ny)

    # Start carving from the center
    carve_path(grid_width // 2, grid_height // 2)

    # Generate walls based on the grid
    for y in range(grid_height):
        for x in range(grid_width):
            if grid[y][x] == 1:
                walls.append({
                    "x": x * GRID_SIZE,
                    "y": y * GRID_SIZE,
                    "width": GRID_SIZE,
                    "height": GRID_SIZE,
                    "health": WALL_MAX_HEALTH
                })

    # Add border walls
    walls.extend([
        {"x": 0, "y": 0, "width": WORLD_WIDTH, "height": WALL_THICKNESS, "health": WALL_MAX_HEALTH},
        {"x": 0, "y": 0, "width": WALL_THICKNESS, "height": WORLD_HEIGHT, "health": WALL_MAX_HEALTH},
        {"x": WORLD_WIDTH - WALL_THICKNESS, "y": 0, "width": WALL_THICKNESS, "height": WORLD_HEIGHT,
         "health": WALL_MAX_HEALTH},
        {"x": 0, "y": WORLD_HEIGHT - WALL_THICKNESS, "width": WORLD_WIDTH, "height": WALL_THICKNESS,
         "health": WALL_MAX_HEALTH}
    ])


generate_maze()


@app.get("/", response_class=HTMLResponse)
async def get(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: int):
    await websocket.accept()
    clients[client_id] = websocket

    # Find a valid starting position
    while True:
        x = random.randint(GRID_SIZE, WORLD_WIDTH - GRID_SIZE)
        y = random.randint(GRID_SIZE, WORLD_HEIGHT - GRID_SIZE)
        if not any(w["x"] < x < w["x"] + w["width"] and w["y"] < y < w["y"] + w["height"] for w in walls):
            players[client_id] = {"x": x, "y": y}
            break

    try:
        # Send initial game state
        await websocket.send_json({
            "type": "init",
            "players": players,
            "walls": walls,
            "world_width": WORLD_WIDTH,
            "world_height": WORLD_HEIGHT
        })

        while True:
            data = await websocket.receive_text()
            event = json.loads(data)

            if event["type"] == "move":
                # Validate player position
                x = max(PLAYER_RADIUS, min(WORLD_WIDTH - PLAYER_RADIUS, event["x"]))
                y = max(PLAYER_RADIUS, min(WORLD_HEIGHT - PLAYER_RADIUS, event["y"]))
                if not any(w["x"] < x < w["x"] + w["width"] and w["y"] < y < w["y"] + w["height"] for w in walls):
                    players[client_id]["x"] = x
                    players[client_id]["y"] = y
                    await broadcast(json.dumps({"type": "move", "client_id": client_id, "x": x, "y": y}))
            elif event["type"] == "throw":
                # Handle throwing money (bullets)
                new_bullet = {
                    "x": event["x"],
                    "y": event["y"],
                    "dx": event["dx"],
                    "dy": event["dy"],
                    "bounces": 0
                }
                bullets.append(new_bullet)
                await broadcast(json.dumps({"type": "throw", "bullet": new_bullet}))
            elif event["type"] == "emote":
                # Handle emotes
                await broadcast(json.dumps({"type": "emote", "client_id": client_id, "emote": event["emote"]}))
    except WebSocketDisconnect:
        del clients[client_id]
        del players[client_id]
        await broadcast(json.dumps({"type": "disconnect", "client_id": client_id}))


async def broadcast(message: str):
    for client in clients.values():
        await client.send_text(message)


def update_bullets():
    global bullets, walls
    new_bullets = []
    for bullet in bullets:
        bullet["x"] += bullet["dx"]
        bullet["y"] += bullet["dy"]

        collision = False
        for wall in walls:
            if (wall["x"] < bullet["x"] < wall["x"] + wall["width"] and
                    wall["y"] < bullet["y"] < wall["y"] + wall["height"]):
                # Bullet hit a wall
                wall["health"] -= 1
                if wall["health"] <= 0:
                    walls.remove(wall)

                # Bounce the bullet
                if abs(bullet["x"] - wall["x"]) < abs(bullet["x"] - (wall["x"] + wall["width"])):
                    bullet["dx"] *= -1
                else:
                    bullet["dy"] *= -1

                bullet["bounces"] += 1
                collision = True
                break

        if not collision and 0 < bullet["x"] < WORLD_WIDTH and 0 < bullet["y"] < WORLD_HEIGHT and bullet["bounces"] < 3:
            new_bullets.append(bullet)

    bullets = new_bullets


async def game_loop():
    while True:
        update_bullets()
        await broadcast(json.dumps({
            "type": "updateBullets",
            "bullets": bullets
        }))
        await broadcast(json.dumps({
            "type": "updateWalls",
            "walls": walls
        }))
        await asyncio.sleep(1 / 60)  # 60 FPS


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(game_loop())


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)