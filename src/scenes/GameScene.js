import Phaser from 'phaser';
import {
    GAME_WIDTH, GAME_HEIGHT,
    WORLD_SPEED, GRAVITY, JUMP_VELOCITY, PLAYER_SIZE,
    GROUND_Y, PLAYER_X, PLAYER_FLOOR_Y,
    SPIKE_WIDTH, SPIKE_HEIGHT, CUBE_SIZE,
    BEAT_MS,
} from '../constants.js';

// ─── Obstacle patterns ───────────────────────────────────────────────────────
// Each entry is an array of { type:'spike'|'cube', xOffset }
// xOffset is relative to the spawn origin; first item is always 0.
const PATTERNS = [
    // Basic – always available
    [{ type: 'spike', xOffset: 0 }],
    [{ type: 'cube',  xOffset: 0 }],
    // Double spike (jump OVER both)
    [{ type: 'spike', xOffset: 0 }, { type: 'spike', xOffset: SPIKE_WIDTH + 4 }],
    // Cube then spike (jump over spike, land OR jump over cube too)
    [{ type: 'cube', xOffset: 0 }, { type: 'spike', xOffset: CUBE_SIZE + 70 }],
    // Spike then cube (jump over spike, land on cube or jump further)
    [{ type: 'spike', xOffset: 0 }, { type: 'cube', xOffset: SPIKE_WIDTH + 70 }],
    // Triple spike
    [
        { type: 'spike', xOffset: 0 },
        { type: 'spike', xOffset: SPIKE_WIDTH + 4 },
        { type: 'spike', xOffset: SPIKE_WIDTH * 2 + 8 },
    ],
];

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.attempts = (data.attempts || 0) + 1;
    }

    create() {
        // ── Graphics layer ──────────────────────────────────────────────────
        this.gfx = this.add.graphics();

        // ── Player state ────────────────────────────────────────────────────
        this.playerY        = PLAYER_FLOOR_Y;
        this.playerVy       = 0;
        this.isOnGround     = true;
        this.prevPlayerBot  = GROUND_Y; // bottom of player from previous frame

        // ── Obstacles ───────────────────────────────────────────────────────
        this.obstacles = [];

        // ── Spawn timer ─────────────────────────────────────────────────────
        // Start with a 3-beat delay so the player can orient themselves.
        this.nextSpawnIn = BEAT_MS * 3;

        // ── Score / state ───────────────────────────────────────────────────
        this.distScore = 0;
        this.dead      = false;

        // ── Input ────────────────────────────────────────────────────────────
        this.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.input.on('pointerdown', () => this.doJump());

        // ── UI text ──────────────────────────────────────────────────────────
        this.attemptsText = this.add.text(14, 12, `Attempt  ${this.attempts}`, {
            fontSize: '14px',
            fontFamily: '"Courier New", Courier, monospace',
            color: '#445566',
        });
        this.scoreText = this.add.text(GAME_WIDTH - 14, 12, 'Score: 0', {
            fontSize: '14px',
            fontFamily: '"Courier New", Courier, monospace',
            color: '#445566',
        }).setOrigin(1, 0);

        // ── Parallax stars ───────────────────────────────────────────────────
        this.stars = Array.from({ length: 70 }, () => ({
            x:     Math.random() * GAME_WIDTH,
            y:     Math.random() * (GROUND_Y - 10),
            size:  Math.random() * 1.5 + 0.4,
            speed: Math.random() * 35 + 15, // slower stars = farther away
        }));
    }

    // ─── Jump ─────────────────────────────────────────────────────────────────
    doJump() {
        if (this.dead) return;
        if (this.isOnGround) {
            this.playerVy   = JUMP_VELOCITY;
            this.isOnGround = false;
        }
    }

    // ─── Main loop ────────────────────────────────────────────────────────────
    update(_time, delta) {
        if (this.dead) return;

        // Cap delta to avoid huge jumps after tab-switch / lag spike
        const dt = Math.min(delta / 1000, 0.05);

        // Score
        this.distScore += WORLD_SPEED * dt;
        this.scoreText.setText(`Score: ${Math.floor(this.distScore)}`);

        // Keyboard jump
        if (Phaser.Input.Keyboard.JustDown(this.jumpKey)) this.doJump();

        // ── Physics ───────────────────────────────────────────────────────
        this.prevPlayerBot = this.playerY + PLAYER_SIZE;

        this.playerVy += GRAVITY * dt;
        this.playerY  += this.playerVy * dt;

        // Reset ground flag; collisions below will re-set if needed.
        this.isOnGround = false;

        // Solid ground
        if (this.playerY >= PLAYER_FLOOR_Y) {
            this.playerY    = PLAYER_FLOOR_Y;
            this.playerVy   = 0;
            this.isOnGround = true;
        }

        // ── Spawn ─────────────────────────────────────────────────────────
        this.nextSpawnIn -= delta;
        if (this.nextSpawnIn <= 0) {
            this.spawnPattern();
            // 2-beat base interval; tighten slightly as score grows (min 1.5 beats)
            const beatMult = Math.max(1.5, 2.5 - this.distScore / 8000);
            this.nextSpawnIn += BEAT_MS * beatMult;
        }

        // ── Move obstacles ────────────────────────────────────────────────
        for (const obs of this.obstacles) {
            obs.x -= WORLD_SPEED * dt;
        }
        // Remove fully off-screen (left edge past canvas)
        this.obstacles = this.obstacles.filter(obs => {
            const rightEdge = obs.type === 'cube' ? obs.x + obs.size : obs.x + obs.w;
            return rightEdge > -80;
        });

        // ── Collisions ────────────────────────────────────────────────────
        for (const obs of this.obstacles) {
            if (obs.type === 'spike') {
                if (this.testSpike(obs)) { this.handleDeath(); return; }
            } else {
                const result = this.testCube(obs);
                if (result === 'die') { this.handleDeath(); return; }
            }
        }

        // ── Parallax stars ────────────────────────────────────────────────
        for (const star of this.stars) {
            star.x -= star.speed * dt;
            if (star.x < 0) star.x += GAME_WIDTH;
        }

        // ── Render ────────────────────────────────────────────────────────
        this.render();
    }

    // ─── Spawn logic ─────────────────────────────────────────────────────────
    spawnPattern() {
        const difficulty = Math.min(1, this.distScore / 5000);

        // Unlock patterns progressively
        const maxPattern = Math.min(
            PATTERNS.length - 1,
            1 + Math.floor(difficulty * (PATTERNS.length - 1))
        );
        const patternIdx = Phaser.Math.Between(0, maxPattern);
        const pattern    = PATTERNS[patternIdx];

        const originX = GAME_WIDTH + 80;
        for (const item of pattern) {
            const x = originX + item.xOffset;
            if (item.type === 'spike') {
                this.obstacles.push({
                    type: 'spike',
                    x,
                    y: GROUND_Y - SPIKE_HEIGHT,
                    w: SPIKE_WIDTH,
                    h: SPIKE_HEIGHT,
                });
            } else {
                this.obstacles.push({
                    type: 'cube',
                    x,
                    y: GROUND_Y - CUBE_SIZE,
                    size: CUBE_SIZE,
                });
            }
        }
    }

    // ─── Collision: spike (AABB with inset for fairness) ─────────────────────
    testSpike(spike) {
        const inset = 6;
        const sx = spike.x + inset;
        const sy = spike.y + inset;
        const sw = spike.w - inset * 2;
        const sh = spike.h - inset;

        const px = PLAYER_X + 3;
        const py = this.playerY + 3;
        const ps = PLAYER_SIZE - 6;

        return px < sx + sw && px + ps > sx && py < sy + sh && py + ps > sy;
    }

    // ─── Collision: cube (AABB; top face = platform, sides/bottom = death) ────
    testCube(cube) {
        const { x: cx, y: cy, size: cs } = cube;
        const px = PLAYER_X;
        const py = this.playerY;
        const ps = PLAYER_SIZE;

        // No overlap at all
        if (px + ps <= cx || px >= cx + cs || py + ps <= cy || py >= cy + cs) {
            return 'none';
        }

        // Landing on top: player bottom was at/above cube top in the previous
        // frame and is now falling (vy >= 0).
        if (this.prevPlayerBot <= cy + 2 && this.playerVy >= 0) {
            this.playerY    = cy - ps;
            this.playerVy   = 0;
            this.isOnGround = true;
            return 'land';
        }

        return 'die';
    }

    // ─── Death ───────────────────────────────────────────────────────────────
    handleDeath() {
        if (this.dead) return;
        this.dead = true;

        // Red flash overlay
        const flash = this.add.graphics();
        flash.fillStyle(0xff1100, 0.5);
        flash.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        this.time.delayedCall(420, () => {
            this.scene.start('GameOverScene', {
                attempts: this.attempts,
                score:    this.distScore,
            });
        });
    }

    // ─── Render ──────────────────────────────────────────────────────────────
    render() {
        const g = this.gfx;
        g.clear();

        // Stars (parallax background)
        for (const star of this.stars) {
            g.fillStyle(0x8899bb, 0.12 + star.size * 0.08);
            g.fillRect(star.x, star.y, star.size, star.size);
        }

        // Ground glow + line
        g.lineStyle(8, 0xffffff, 0.05);
        g.beginPath(); g.moveTo(0, GROUND_Y); g.lineTo(GAME_WIDTH, GROUND_Y); g.strokePath();
        g.lineStyle(2, 0xddeeff, 0.80);
        g.beginPath(); g.moveTo(0, GROUND_Y); g.lineTo(GAME_WIDTH, GROUND_Y); g.strokePath();

        // Obstacles
        for (const obs of this.obstacles) {
            obs.type === 'spike' ? this.renderSpike(g, obs) : this.renderCube(g, obs);
        }

        // Player
        this.renderPlayer(g);
    }

    renderPlayer(g) {
        const x = PLAYER_X;
        const y = this.playerY;
        const s = PLAYER_SIZE;

        // Outer glow layers
        g.fillStyle(0x00ff88, 0.06);
        g.fillRect(x - 10, y - 10, s + 20, s + 20);
        g.fillStyle(0x00ff88, 0.12);
        g.fillRect(x - 5,  y - 5,  s + 10, s + 10);

        // Main body
        g.fillStyle(0x00ff88, 1);
        g.fillRect(x, y, s, s);

        // Inner highlight (top-left corner → 3-D feel)
        g.fillStyle(0xbbffdd, 0.55);
        g.fillRect(x + 3, y + 3, s - 6, 4);  // top bar
        g.fillRect(x + 3, y + 3, 4, s - 6);  // left bar
    }

    renderSpike(g, spike) {
        const bx = spike.x;
        const tip = spike.y;          // y of the tip (top)
        const base = GROUND_Y;        // y of the base (ground level)
        const mid = bx + spike.w / 2;

        // Fill
        g.fillStyle(0x10102a, 1);
        g.beginPath();
        g.moveTo(bx,        base);
        g.lineTo(mid,       tip);
        g.lineTo(bx + spike.w, base);
        g.closePath();
        g.fillPath();

        // Edge outline (no base edge — merges with ground)
        g.lineStyle(1.5, 0x3a4466, 1);
        g.beginPath();
        g.moveTo(bx, base);
        g.lineTo(mid, tip);
        g.lineTo(bx + spike.w, base);
        g.strokePath();
    }

    renderCube(g, cube) {
        const { x, y, size: s } = cube;

        // Fill
        g.fillStyle(0x10102a, 1);
        g.fillRect(x, y, s, s);

        // Side edges
        g.lineStyle(1.5, 0x3a4466, 1);
        g.strokeRect(x, y, s, s);

        // Top-face accent (slightly brighter → hints at "landable")
        g.lineStyle(2.5, 0x5566aa, 1);
        g.beginPath();
        g.moveTo(x,     y);
        g.lineTo(x + s, y);
        g.strokePath();
    }
}
