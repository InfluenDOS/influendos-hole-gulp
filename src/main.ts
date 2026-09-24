import Phaser from 'phaser'
import { audio } from './game/audio'
import { gameConfig } from './game/config'

const unlock = () => audio.unlock()
window.addEventListener('pointerdown', unlock)
window.addEventListener('keydown', unlock)
window.addEventListener('contextmenu', (event) => event.preventDefault())

new Phaser.Game(gameConfig)
