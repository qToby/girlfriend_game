import Phaser from 'phaser';
import { createModal, showModal, hideModal, isModalOpen } from '../ui/modal.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const TILE_SIZE   = 32;
const MAP_COLS    = 20;
const MAP_ROWS    = 20;
const PLAYER_SPEED     = 160; // pixels per second
const INTERACT_RANGE   = TILE_SIZE * 1.5; // pixels — how close you need to be
const PLAYER_HALF_BOX  = 11;  // half of the collision box (player sprite is 32px wide)

// ─── Tile map builder ─────────────────────────────────────────────────────────
// 1 = wall, 0 = floor
function buildMap() {
  const map = [];
  for (let row = 0; row < MAP_ROWS; row++) {
    map[row] = [];
    for (let col = 0; col < MAP_COLS; col++) {
      const isEdge = col === 0 || col === MAP_COLS - 1 || row === 0 || row === MAP_ROWS - 1;
      map[row][col] = isEdge ? 1 : 0;
    }
  }
  return map;
}

// ─── Scene ────────────────────────────────────────────────────────────────────
export class RoomScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RoomScene' });
  }

  preload() {
    // Player spritesheet — 4×4 grid, each frame 32×48
    // row 0: walk-down (0–3) | row 1: walk-left (4–7)
    // row 2: walk-right (8–11) | row 3: walk-up (12–15)
    this.load.spritesheet('player', '/assets/player.png', {
      frameWidth:  32,
      frameHeight: 48,
    });

    // Room assets
    this.load.image('floor',              '/assets/floor.png');
    this.load.image('bed',                '/assets/bed.png');
    this.load.image('bed_facing_right',   '/assets/bed_facing_right.png');
    this.load.image('book',               '/assets/book.png');
    this.load.image('photoframe',         '/assets/photoframe.jpg');
    this.load.image('plant1',             '/assets/plant1.png');
    this.load.image('sofa_facing_right',  '/assets/sofa_facing_right.png');
    this.load.image('window_facing_down', '/assets/window_facing_down.png');
    this.load.image('desk_facing_down',   '/assets/desk_facing_down.png');
    this.load.image('tv_facing_down',     '/assets/tv_facing_down.png');
    this.load.image('wall',               '/assets/wall.png');
  }

  // ── create: build the room and set up all game objects ──────────────────────
  create() {
    this.map = buildMap();

    // Solid interactable tiles (empty for now — filled when collisions are added)
    this.solidInteractableTiles = new Set();

    // ── Draw all tiles ────────────────────────────────────────────────────────
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const key = this.map[row][col] === 1 ? 'wall' : 'floor';
        this.add.image(
          col * TILE_SIZE + TILE_SIZE / 2,
          row * TILE_SIZE + TILE_SIZE / 2,
          key
        ).setDepth(0);
      }
    }

    // ── Furniture + interactables (registered inside setupFurniture) ──────────
    this.interactables = [];
    this.setupFurniture();

    // ── Player ────────────────────────────────────────────────────────────────
    // Start near the centre of the room
    this.playerX = 10 * TILE_SIZE + TILE_SIZE / 2;
    this.playerY = 10 * TILE_SIZE + TILE_SIZE / 2;

    this.playerSprite = this.add
      .sprite(this.playerX, this.playerY, 'player', 0)
      .setDepth(this.playerY);

    // ── Animations ────────────────────────────────────────────────────────────
    // Each row is 4 frames; frameRate 8 gives a natural walking pace.
    const anims = [
      { key: 'walk-down',  frames: { start: 0,  end: 3  } },
      { key: 'walk-left',  frames: { start: 4,  end: 7  } },
      { key: 'walk-right', frames: { start: 8,  end: 11 } },
      { key: 'walk-up',    frames: { start: 12, end: 15 } },
    ];
    anims.forEach(({ key, frames }) => {
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers('player', frames),
          frameRate: 8,
          repeat: -1, // loop while walking
        });
      }
    });

    // Track last facing direction so we can show the correct idle frame on stop
    this.lastDirection = 'down';

    // ── Input ─────────────────────────────────────────────────────────────────
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd    = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // E key: close modal if open, otherwise try to interact
    this.eKey.on('down', () => {
      if (isModalOpen()) { hideModal(); return; }
      this.tryInteract();
    });

    // ── HTML modal ────────────────────────────────────────────────────────────
    createModal();

    // ── HUD: controls reminder ────────────────────────────────────────────────
    this.add
      .text(MAP_COLS * TILE_SIZE / 2, MAP_ROWS * TILE_SIZE + 10,
        'Arrow keys / WASD: move   •   E: interact',
        {
          fontSize: '11px',
          fontFamily: 'Courier New',
          color: '#888888',
        }
      )
      .setOrigin(0.5, 0.5)
      .setDepth(300);
  }

  // ── update: movement + hint visibility ──────────────────────────────────────
  update(_time, delta) {
    // Pause everything while a modal is displayed
    if (isModalOpen()) return;

    const dt = delta / 1000; // seconds
    let dx = 0;
    let dy = 0;

    if (this.cursors.left.isDown  || this.wasd.left.isDown)  dx = -1;
    else if (this.cursors.right.isDown || this.wasd.right.isDown) dx = 1;

    if (this.cursors.up.isDown    || this.wasd.up.isDown)    dy = -1;
    else if (this.cursors.down.isDown  || this.wasd.down.isDown)  dy = 1;

    if (dx !== 0 || dy !== 0) {
      const step = PLAYER_SPEED * dt;

      // Check horizontal and vertical axes independently so the player
      // can slide along walls instead of getting stuck on corners.
      const nx = this.playerX + dx * step;
      const ny = this.playerY + dy * step;

      if (dx !== 0 && this.canMoveTo(nx, this.playerY)) this.playerX = nx;
      if (dy !== 0 && this.canMoveTo(this.playerX, ny)) this.playerY = ny;

      this.playerSprite.x     = Math.round(this.playerX);
      this.playerSprite.y     = Math.round(this.playerY);
      this.playerSprite.depth = this.playerY; // Y-sorting

      // Pick animation — vertical movement takes priority over diagonal
      let dir;
      if      (dy < 0) dir = 'up';
      else if (dy > 0) dir = 'down';
      else if (dx < 0) dir = 'left';
      else             dir = 'right';

      if (dir !== this.lastDirection || !this.playerSprite.anims.isPlaying) {
        this.playerSprite.anims.play(`walk-${dir}`, true);
        this.lastDirection = dir;
      }
    } else {
      // Stopped — freeze on the first frame of the last direction
      if (this.playerSprite.anims.isPlaying) {
        this.playerSprite.anims.stop();
        // idle frame = first frame of the last direction row
        const idleFrame = { down: 0, left: 4, right: 8, up: 12 }[this.lastDirection];
        this.playerSprite.setFrame(idleFrame);
      }
    }

    // Show "[E]" hint only when close enough to an interactable
    this.interactables.forEach(({ wx, wy, hint }) => {
      const dist = Phaser.Math.Distance.Between(this.playerX, this.playerY, wx, wy);
      hint.setVisible(dist < INTERACT_RANGE);
    });
  }

  // ── Furniture ────────────────────────────────────────────────────────────────

  setupFurniture() {
    // Place a sprite with its bottom edge aligned to the bottom of tileRow.
    // origin (0.5, 1): x = horizontal centre of the tile column,
    //                  y = bottom edge of the tile row.
    // depth defaults to y so objects lower on screen naturally render in front.
    const place = (key, tileCol, tileRow, depth) => {
      const x = tileCol * TILE_SIZE + TILE_SIZE / 2;
      const y = (tileRow + 1) * TILE_SIZE;
      return this.add.image(x, y, key)
        .setOrigin(0.5, 1)
        .setDepth(depth ?? y);
    };

    // Bed (horizontal, headboard on the left) — against the left wall
    place('bed_facing_right', 3, 6);

    // Window — centred on top wall, row 1 sits right below the wall tile
    place('window_facing_down', 10, 1);

    // Desk — directly below the window
    const desk = place('desk_facing_down', 10, 4);

    // Book — on top of the desk (depth + 1 so it renders above the desk surface)
    place('book', 10, 4, desk.depth + 1);

    // TV — against the right wall
    place('tv_facing_down', 16, 3);

    // Sofa — facing right toward the TV, a few tiles in front of it
    place('sofa_facing_right', 12, 9);

    // Plant — bottom-right corner
    place('plant1', 17, 17);

    // Photo frame — on the top wall, left side — interactable
    const photoSprite = place('photoframe', 5, 1);

    // Hint floats just above the sprite's top edge
    const photoHint = this.add
      .text(photoSprite.x, photoSprite.y - photoSprite.height - 4, '[E]', {
        fontSize: '11px',
        fontFamily: 'Courier New',
        color: '#ffffff',
        backgroundColor: '#000000bb',
        padding: { x: 3, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(200)
      .setVisible(false);

    this.interactables.push({
      wx: photoSprite.x,
      wy: photoSprite.y,
      hint: photoHint,
      onInteract: () => showModal({
        imageUrl: '/assets/images/first_date.jpg',
        title: 'Our First Adventure',
        text: 'A photo from the day everything started. Some memories are worth keeping forever.',
      }),
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  /**
   * Returns true if the player can occupy world position (wx, wy)
   * without overlapping a wall or a solid interactable tile.
   * Tests all four corners of the player's collision box.
   */
  canMoveTo(wx, wy) {
    const corners = [
      { x: wx - PLAYER_HALF_BOX, y: wy - PLAYER_HALF_BOX },
      { x: wx + PLAYER_HALF_BOX, y: wy - PLAYER_HALF_BOX },
      { x: wx - PLAYER_HALF_BOX, y: wy + PLAYER_HALF_BOX },
      { x: wx + PLAYER_HALF_BOX, y: wy + PLAYER_HALF_BOX },
    ];

    for (const { x, y } of corners) {
      const col = Math.floor(x / TILE_SIZE);
      const row = Math.floor(y / TILE_SIZE);

      if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return false;
      if (this.map[row][col] === 1) return false;
      if (this.solidInteractableTiles.has(`${col},${row}`)) return false;
    }
    return true;
  }

  /**
   * If the player is within range of any interactable, open its modal.
   */
  tryInteract() {
    for (const obj of this.interactables) {
      const dist = Phaser.Math.Distance.Between(this.playerX, this.playerY, obj.wx, obj.wy);
      if (dist < INTERACT_RANGE) {
        obj.onInteract();
        return; // only trigger the closest one
      }
    }
  }
}
