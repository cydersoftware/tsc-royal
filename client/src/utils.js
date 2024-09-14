/**
 * Performs linear interpolation between two values.
 * @param {number} start - The start value.
 * @param {number} end - The end value.
 * @param {number} t - The interpolation factor (0-1).
 * @return {number} The interpolated value.
 */
export function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

/**
 * Clamps a value between a minimum and maximum value.
 * @param {number} value - The value to clamp.
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @return {number} The clamped value.
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Calculates the distance between two points.
 * @param {number} x1 - The x-coordinate of the first point.
 * @param {number} y1 - The y-coordinate of the first point.
 * @param {number} x2 - The x-coordinate of the second point.
 * @param {number} y2 - The y-coordinate of the second point.
 * @return {number} The distance between the two points.
 */
export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Generates a random integer between min (inclusive) and max (inclusive).
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @return {number} A random integer between min and max.
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Converts radians to degrees.
 * @param {number} radians - The angle in radians.
 * @return {number} The angle in degrees.
 */
export function radToDeg(radians) {
    return radians * (180 / Math.PI);
}

/**
 * Converts degrees to radians.
 * @param {number} degrees - The angle in degrees.
 * @return {number} The angle in radians.
 */
export function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Checks if two rectangles intersect.
 * @param {Object} rect1 - The first rectangle {x, y, width, height}.
 * @param {Object} rect2 - The second rectangle {x, y, width, height}.
 * @return {boolean} True if the rectangles intersect, false otherwise.
 */
export function rectIntersect(rect1, rect2) {
    return (rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y);
}

/**
 * Checks if a point is inside a rectangle.
 * @param {number} x - The x-coordinate of the point.
 * @param {number} y - The y-coordinate of the point.
 * @param {Object} rect - The rectangle {x, y, width, height}.
 * @return {boolean} True if the point is inside the rectangle, false otherwise.
 */
export function pointInRect(x, y, rect) {
    return (x >= rect.x && x <= rect.x + rect.width &&
        y >= rect.y && y <= rect.y + rect.height);
}

/**
 * Performs a deep clone of an object.
 * @param {Object} obj - The object to clone.
 * @return {Object} A deep clone of the object.
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}