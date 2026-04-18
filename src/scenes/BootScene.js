import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER_SIZE } from '../constants.js';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        const g = this.add.graphics();

        // Static background stars
        for (let i = 0; i < 80; i++) {
            const alpha = Math.random() * 0.3 + 0.05;
            const size  = Math.random() * 1.5 + 0.5;
            g.fillStyle(0x8899bb, alpha);
            g.fillRect(
                Math.random() * GAME_WIDTH,
                Math.random() * GAME_HEIGHT,
                size, size
            );
        }

        // Logo cube
        const lx = GAME_WIDTH / 2 - 22;
        const ly = GAME_HEIGHT / 2 - 130;
        const ls = 44;
        g.fillStyle(0x00ff88, 0.10);
        g.fillRect(lx - 10, ly - 10, ls + 20, ls + 20);
        g.fillStyle(0x00ff88, 0.18);
        g.fillRect(lx - 5, ly - 5, ls + 10, ls + 10);
        g.fillStyle(0x00ff88, 1);
        g.fillRect(lx, ly, ls, ls);
        g.fillStyle(0xaaffcc, 0.55);
        g.fillRect(lx + 3, ly + 3, ls - 6, 5);
        g.fillRect(lx + 3, ly + 3, 5, ls - 6);

        // Title
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'AURA CUBE', {
            fontSize: '48px',
            fontFamily: '"Courier New", Courier, monospace',
            color: '#00ff88',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, '128 BPM  ·  infinite runner', {
            fontSize: '14px',
            fontFamily: '"Courier New", Courier, monospace',
            color: '#445566',
        }).setOrigin(0.5);

        // Ground line
        g.lineStyle(2, 0xddeeff, 0.7);
        g.beginPath();
        g.moveTo(0, GAME_HEIGHT - 40);
        g.lineTo(GAME_WIDTH, GAME_HEIGHT - 40);
        g.strokePath();

        // Prompt (blinking)
        const prompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 'SPACE  or  TAP  to  start', {
            fontSize: '17px',
            fontFamily: '"Courier New", Courier, monospace',
            color: '#aabbcc',
        }).setOrigin(0.5);

        this.time.addEvent({
            delay: 520,
            callback: () => prompt.setAlpha(prompt.alpha < 0.5 ? 1 : 0.25),
            loop: true,
        });

        // Input → start
        this.input.keyboard.once('keydown-SPACE', () =>
            this.scene.start('GameScene', { attempts: 0 })
        );
        this.input.once('pointerdown', () =>
            this.scene.start('GameScene', { attempts: 0 })
        );
    }
}
