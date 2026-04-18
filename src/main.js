import Phaser from 'phaser';
import { BootScene }    from './scenes/BootScene.js';
import { GameScene }    from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';

const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#07070f',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, GameScene, GameOverScene],
};

new Phaser.Game(config);
