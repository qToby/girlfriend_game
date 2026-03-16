// Phaser game configuration
import Phaser from 'phaser';
import { RoomScene } from './scenes/RoomScene.js';

const TILE_SIZE = 32;
const MAP_COLS  = 20;
const MAP_ROWS  = 20;

export function createGame() {
  return new Phaser.Game({
    type: Phaser.AUTO,
    width:  MAP_COLS * TILE_SIZE,     // 640
    height: MAP_ROWS * TILE_SIZE + 20, // 660 — 20px extra for the hint bar
    backgroundColor: '#0f0f1a',
    pixelArt: true, // keeps pixel textures sharp
    scene: [RoomScene],
    parent: document.body,
  });
}
