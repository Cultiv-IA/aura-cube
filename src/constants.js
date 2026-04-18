// ─── Configurable game constants ─────────────────────────────────────────────

export const GAME_WIDTH    = 800;   // canvas width  (px)
export const GAME_HEIGHT   = 400;   // canvas height (px)

export const WORLD_SPEED   = 320;   // horizontal scrolling speed  (px/s)
export const GRAVITY       = 1800;  // downward acceleration       (px/s²)
export const JUMP_VELOCITY = -720;  // initial upward velocity     (px/s)
export const PLAYER_SIZE   = 32;    // player square side length   (px)

export const BPM           = 128;   // obstacle rhythm base (beats per minute)

// ─── Derived / layout ────────────────────────────────────────────────────────

export const GROUND_Y      = GAME_HEIGHT - 40;       // y-coordinate of ground line
export const PLAYER_X      = 120;                    // fixed player x position
export const PLAYER_FLOOR_Y = GROUND_Y - PLAYER_SIZE; // player y when standing on ground

export const SPIKE_WIDTH   = 36;   // spike base width (px)
export const SPIKE_HEIGHT  = 40;   // spike height     (px)
export const CUBE_SIZE     = 36;   // obstacle cube side length (px)

export const BEAT_MS       = (60 / BPM) * 1000; // milliseconds per beat (~468.75 ms)
