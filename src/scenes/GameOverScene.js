import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.attempts = data.attempts || 1;
        this.score    = data.score    || 0;
    }

    create() {
        const g = this.add.graphics();

        // Dim overlay
        g.fillStyle(0x000000, 0.75);
        g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // GAME OVER title
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, 'GAME OVER', {
            fontSize: '52px',
            fontFamily: '"Courier New", Courier, monospace',
            color: '#ff3333',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        // Stats
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, `Attempt #${this.attempts}`, {
            fontSize: '22px',
            fontFamily: '"Courier New", Courier, monospace',
            color: '#ccddee',
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 28, `Score: ${Math.floor(this.score)}`, {
            fontSize: '18px',
            fontFamily: '"Courier New", Courier, monospace',
            color: '#778899',
        }).setOrigin(0.5);

        // Prompt
        const prompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 90, 'SPACE  or  TAP  to  retry', {
            fontSize: '16px',
            fontFamily: '"Courier New", Courier, monospace',
            color: '#aabbcc',
        }).setOrigin(0.5);

        this.time.addEvent({
            delay: 500,
            callback: () => prompt.setAlpha(prompt.alpha < 0.5 ? 1 : 0.25),
            loop: true,
        });

        // Slight delay before accepting input to prevent accidental restart
        this.time.delayedCall(600, () => {
            this.input.keyboard.once('keydown-SPACE', () =>
                this.scene.start('GameScene', { attempts: this.attempts })
            );
            this.input.once('pointerdown', () =>
                this.scene.start('GameScene', { attempts: this.attempts })
            );
        });
    }
}
