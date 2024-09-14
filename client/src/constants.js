// Player constants
export const PLAYER_SPEED = 2;
export const PLAYER_RADIUS = 12;
export const MAX_HEALTH = 100;
export const GUN_LENGTH = 30;
export const FLASH_DURATION = 100; // Duration of muzzle flash in milliseconds

// Bullet constants
export const BULLET_RADIUS = 5;
export const BULLET_SPEED = 5;

// World constants
export const WORLD_WIDTH = 2000;
export const WORLD_HEIGHT = 2000;

// Game mechanics constants
export const INTERPOLATION_DELAY = 100; // ms

// Wall constants
export const WALL_MAX_HEALTH = 3;

// Network constants
export const WEBSOCKET_URL = `ws://${window.location.host}/ws/`;

// Rendering constants
export const BACKGROUND_COLOR = '#e0e0e0';
export const WALL_BASE_COLOR = 160;
export const WALL_SHADE_DARKNESS = 40;
export const WALL_PERSPECTIVE = 0.5;
export const WALL_HEIGHT = 50;

// UI constants
export const HEALTH_BAR_HEIGHT = 5;
export const EMOTE_DURATION = 2000; // Duration to display emote in milliseconds

// Physics constants
export const COLLISION_PADDING = 1; // Small padding to prevent getting stuck in walls

// Game state constants
export const GAME_STATE = {
    WAITING: 'waiting',
    PLAYING: 'playing',
    GAME_OVER: 'game_over'
};

// Key mappings
export const KEY_MAPPINGS = {
    MOVE_LEFT: 'ArrowLeft',
    MOVE_RIGHT: 'ArrowRight',
    MOVE_UP: 'ArrowUp',
    MOVE_DOWN: 'ArrowDown',
    SHOOT: 'Space'
};

// Audio constants
export const AUDIO = {
    SHOOT: 'shoot.mp3',
    HIT: 'hit.mp3',
    WALL_BREAK: 'wall_break.mp3'
};

// Performance constants
export const MAX_FPS = 60;
export const TICK_RATE = 60;