import Phaser from 'phaser'
import { BootScene } from '../scenes/BootScene'
import { CheckinScene } from '../scenes/CheckinScene'
import { CreditsScene } from '../scenes/CreditsScene'
import { MapScene } from '../scenes/MapScene'
import { PlayScene } from '../scenes/PlayScene'
import { SettingsScene } from '../scenes/SettingsScene'
import { SkinsScene } from '../scenes/SkinsScene'
import { TitleScene } from '../scenes/TitleScene'
import { GAME_H, GAME_W } from './theme'

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#140e0c',
  banner: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_W,
    height: GAME_H,
  },
  audio: { noAudio: true },
  input: { activePointers: 2 },
  render: { antialias: true, powerPreference: 'high-performance' },
  scene: [BootScene, TitleScene, MapScene, PlayScene, CheckinScene, SkinsScene, SettingsScene, CreditsScene],
}
