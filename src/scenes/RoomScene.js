import Phaser from 'phaser';
import { createModal, showModal, showBookModal, hideModal, isModalOpen } from '../ui/modal.js';
import { DialogueUI } from '../ui/DialogueUI.js';

const texts = [
`Tage werden kürzer, Abende kälter und die Gedanken düsterer.
Ich sehne mich nach Nähe, Wärme, Liebe.
Ich sehne mich nach dir.

Aber ich weiß nicht wie du heißt, wo du lebst, wann wir uns begegnen und wer du bist. Doch ich bin mir sicher dich gibt es und ich freue mich dich kennenzulernen.
Werde melancholisch wenn ich mir vorstelle dass ich als alter Mann an unsere erste Begegnung zurückdenke.
Und kann es kaum erwarten dir das erste Mal in die Augen zu blicken - deine Stimme zu hören, zu erfahren wie du die Welt siehst und deinen Atem auf meiner Haut zu spüren.
Hoffentlich lässt du mich nicht mehr zu lange warten - ich sehne mich nach dir.`,


`And then I sat there - on a small bench in the smoking area in front of my dorm on a Saturday morning. Dawn is already beginning to show, your scarf scratches against my neck, tears relentlessly carve new paths down my cheeks, and Sam Smith sings „Too good at goodbyes“ just for me through my AirPods.
And yet I’m not good at goodbyes at all.
So be it.

I haven’t felt this intensely in a long time.
Leona Lewis begins to sing.

Bleeding love.
But love.`,

`„Apricity“ - A Word I stumbled across today.
A word that reminded me of you.
It describes the the warmth of the sun in winter.
The delightful feeling of sunrays on your skin, similar to the feeling of your gaze on a tough day.`,

`Sometimes I ask myself weather you would have liked me a year ago. If it would have worked out between us.
Maybe not.
Probably not.
The substance hasn’t changed, but my way of carrying myself.
Perhaps there are these invisible strings tying us together and waiting for the right moment to pull us close.
And if not, I was just incredibly lucky.
Either way, I won’t complain.`,

`It’s crazy how you occupy my mind despite being thousands of miles away.
And even crazier considering the way you make me feel. You’re existence alone gives me warmth.
Again the metaphor of you being my sun fits perfectly. So far away and still so bright, so full of life.`,


`And again I‘m lying in bed thinking about you. Crying. But not because you hurt me, but because I can’t bare the thought of losing you.
It’s like they say - only the ones that fly high can fall deep.
And I think I‘m flying as high as one possible can.
Let’s just hope I‘ll never fall. I want my last fall to be the time I fell for you.`,

`Sitting on the train leaving Daejeon for the last time.
That’s where it hits me: I‘m leaving behind the place I met you, the place we fell in love.
Continuing life, but something has changed.
I have an amazing, beautiful and loving girlfriend now. With a soul so magnificent you cannot help but fall for her.
Leaving the city behind as someone new. Thanks to her.`,

`I didn’t write as much for a long time. You made me want to get creative again. You make me feel so much I have to write it down.
I was searching for someone like that.
But some things are better found when not looking for it. You were such a case. Like a photo-album from childhood you find when cleaning up your room. Like the CD you forgot about, carrying songs that shaped you when you were younger.
You‘re all my favorite songs. All my favorite pictures. All the emotions I forgot about. Everything - all at once.`,

`Thinking about the time we had together in Thailand lets me ask myself if there is anything that could make me as happy as you. I doubt it. I think those count to the happiest days of my life. Thank you for giving me the privilege of feeling that way.
To all the poets that describe the things I have felt with you.`,

`Feeling the breeze on my arm as it’s hanging over the railing of the ship that‘s bringing me back from Ko Phi Phi.
Feeling the waves carrying us to shore as I’m writing this.
AirPods in, thinking about you.
Opening notes on my phone in another desperate attempt to somehow verbalize my feelings towards you.
Just because „I love you“ doesn’t seem enough anymore.
Listening to Pink Floyd’s „Wish you were here“ on repeat.
It’s a great song.

„How I wish, how I wish you were here
We're just two lost souls swimming in a fishbowl, year after year“

Though I think we’re maybe not two lost souls anymore - or maybe we’re just lost together.`,

`I just said goodbye again.
It hurts, but at the same time I am excited to see you again.
I love you.`,
];

// ─── Book pages ────────────────────────────────────────────────────────────────
const BOOK_PAGES = [
  {
    title: 'Dezembermelancholie - 27.12.2024',
    text:  texts[0]},
  {
    title: 'Bleeding Love - 20.12.2025',
    text: texts[1]},
  {
    title: 'Apricity',
    text: texts[2]
    },
  {
      title: 'Lucky guy',
      text: texts[3]
  },
   {
    title: 'Sun metaphor nr. 107',
    text: texts[4]
    },
   {
    title: 'flying high',
    text: texts[5]
    },
   {
    title: 'Goodbye Daejeon',
    text: texts[6]
    },
   {
    title: 'Thanks for making me write again - 17.01.2026',
    text: texts[7]
    },
   {
    title: 'Thailand with you - 09.02.2026',
    text: texts[8]
    },
   {
    title: 'Wish you were here - 20.02.2026',
    text: texts[9]
    },
   {
    title: 'Say goodbye again',
    text: texts[10]
    },
];

// ─── Constants ────────────────────────────────────────────────────────────────
const TILE_SIZE   = 32;
const MAP_COLS    = 20;
const MAP_ROWS    = 12;
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
    this.load.image('desk_with_chair',   '/assets/desk_with_chair.png');
    this.load.image('book',               '/assets/book.png');
    this.load.image('photoframe',         '/assets/photoframe.jpg');
    this.load.image('plant1',             '/assets/plant1.png');
    this.load.image('plant2',             '/assets/plant2.png');
    this.load.image('sofa_facing_right',  '/assets/sofa_facing_right.png');
    this.load.image('sofa_facing_up',     '/assets/sofa_facing_up.png');
    this.load.image('window_facing_down', '/assets/window_facing_down.png');
    this.load.image('window_big_facing_down', '/assets/window_big_facing_down.png');
    this.load.image('desk_facing_down',   '/assets/desk_facing_down.png');
    this.load.image('cupboard_big_facing_down',   '/assets/cupboard_big_facing_down.png');
    this.load.image('cupboard_small_facing_down',   '/assets/cupboard_small_facing_down.png');
    this.load.image('tv_facing_down',     '/assets/tv_facing_down.png');

    this.load.image('box',               '/assets/box.png');
    this.load.image('table',               '/assets/table.png');

    this.load.image('carpet_green',               '/assets/carpet_green.png');
    this.load.image('carpet_red',               '/assets/carpet_red.png');
    this.load.image('bookshelf_facing_down', '/assets/bookshelf_facing_down.png');
    this.load.image('wall',               '/assets/wall.png');
  }

  // ── create: build the room and set up all game objects ──────────────────────
  create() {
    this.map = buildMap();

    // Solid interactable tiles (empty for now — filled when collisions are added)
    this.solidInteractableTiles = new Set();

    // Pixel-space axis-aligned bounding boxes for furniture collision.
    // Each entry: { left, right, top, bottom } in world pixels.
    // Only covers the lower portion of each sprite (the part touching the floor).
    this.furnitureColliders = [];

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
    this.playerX = 2.5 * TILE_SIZE + TILE_SIZE / 2;
    this.playerY = 7.5 * TILE_SIZE + TILE_SIZE / 2;

    this.playerSprite = this.add
      .sprite(this.playerX, this.playerY, 'player', 4)
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

    // ── Dialogue UI ───────────────────────────────────────────────────────────
    this.dialogueUI = new DialogueUI(this);
    this.dialogueUI.startDialogue([
      'Oh... you woke up in your boyfriend\'s room. (Press X)',
      'He seems to be gone already. Let\'s explore his stuff...',
      'Use the arrow keys or WASD to walk around.',
      'Press E near objects to interact with them.',
      'Press X to skip or continue dialogue.',
    ]);
  }

  // ── update: movement + hint visibility ──────────────────────────────────────
  update(_time, delta) {
    // Pause everything while a modal or dialogue UI is displayed
    if (isModalOpen() || this.dialogueUI.isActive()) return;

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
    //
    // opts.hasHitbox   — whether the object blocks the player (false for carpets / wall art)
    // opts.hitboxHeight — height in pixels of the collision band at the bottom of the
    //                     sprite (defaults to TILE_SIZE = 32 px, i.e. one tile)
    const place = (key, tileCol, tileRow, depth, opts = {}) => {
      const x = tileCol * TILE_SIZE + TILE_SIZE / 2;
      const y = (tileRow + 1) * TILE_SIZE;
      const sprite = this.add.image(x, y, key)
        .setOrigin(0.5, 1)
        .setDepth(depth ?? y);

      if (opts.hasHitbox) {
        const hitboxHeight = opts.hitboxHeight ?? TILE_SIZE;
        const hw = sprite.width / 2;
        this.furnitureColliders.push({
          left:   x - hw,
          right:  x + hw,
          top:    y - hitboxHeight,
          bottom: y,
        });
      }

      return sprite;
    };

    // Attach a floating [E] hint and register the sprite as interactable.
    // wx/wy defaults to the sprite's world position; pass overrides if needed.
    const registerInteractable = (sprite, onInteract, { wx, wy } = {}) => {
      const worldX = wx ?? sprite.x;
      const worldY = wy ?? sprite.y;
      const hint = this.add
        .text(sprite.x, sprite.y - sprite.height - 4, '[E]', {
          fontSize: '11px',
          fontFamily: 'Courier New',
          color: '#ffffff',
          backgroundColor: '#000000bb',
          padding: { x: 3, y: 2 },
        })
        .setOrigin(0.5, 1)
        .setDepth(200)
        .setVisible(false);
      this.interactables.push({ wx: worldX, wy: worldY, hint, onInteract });
    };


    const bedInteract = () => this.dialogueUI.startChoice(
      'Do you want to sleep again?',
      ['Yes', 'No'],
      (answer) => {
        this.dialogueUI.startDialogue(
          answer === 'Yes'
            ? ['yawwwn', 'you just woke up, dont go to bed already, explore the room first...']
            : ['POWER', 'lets explore the room first!']
        );
      }
    );
    // Bed (horizontal, headboard on the left) — against the left wall
    //place('bed_facing_right', 2, 9, this.playerY-1, { hasHitbox: true, hitboxHeight: TILE_SIZE });
    const bed = place('bed_facing_right', 2, 9, this.playerY+1, { hasHitbox: true, hitboxHeight: TILE_SIZE });
    registerInteractable(bed, bedInteract);


    // Window — centred on top wall, row 1 sits right below the wall tile
    place('window_big_facing_down', 10, 0, this.playerY-1, { hasHitbox: false });

    // Desk — directly below the window
    const desk = place('desk_facing_down', 1, 4, this.playerY-1, { hasHitbox: true, hitboxHeight: TILE_SIZE });
    const desk_with_chair = place('desk_with_chair', 4, 1.1, this.playerY-1, { hasHitbox: true, hitboxHeight: TILE_SIZE });

    // Book — on top of the desk; interactable page-flipper
    const bookSprite = place('book', 4, 0, desk_with_chair.depth + 1, { hasHitbox: false });
    registerInteractable(bookSprite, () => showBookModal(BOOK_PAGES));

    place('cupboard_small_facing_down', 10, 1, this.playerY-1, { hasHitbox: true, hitboxHeight: TILE_SIZE });
    place('cupboard_big_facing_down',   8,  1, this.playerY-1, { hasHitbox: true, hitboxHeight: TILE_SIZE });

    place('bookshelf_facing_down', 3, 1, this.playerY-1, { hasHitbox: true, hitboxHeight: TILE_SIZE });

    // Carpets — no hitbox, player walks on top of them
    place('carpet_red', 4, 7, this.playerY-1, { hasHitbox: false });

    // Box — interactable; opens choice dialogue
    const boxInteract = () => this.dialogueUI.startChoice(
      'Check whats in the boxes?',
      ['Yes', 'No'],
      (answer) => {
        this.dialogueUI.startDialogue(
          answer === 'Yes'
            ? ['You hesitate...', 'Maybe its not a great idea to go through his private items...']
            : ['That seems respectful']
        );
      }
    );

    const box = place('box', 1.5, 5, this.playerY-1, { hasHitbox: true, hitboxHeight: TILE_SIZE });
    registerInteractable(box, boxInteract);
    //place('box', 1.5, 7, this.playerY-1, { hasHitbox: true, hitboxHeight: TILE_SIZE });

    place('table', 16, 4.8, this.playerY-1, { hasHitbox: true, hitboxHeight: TILE_SIZE });

    // TV — against the right wall
    place('tv_facing_down', 16, 2, this.playerY-1, { hasHitbox: true, hitboxHeight: TILE_SIZE });


    // Sofa — facing right toward the TV, a few tiles in front of it
    place('sofa_facing_right', 14, 5, this.playerY-1, { hasHitbox: true, hitboxHeight: TILE_SIZE });
    place('sofa_facing_up',    16, 6, this.playerY-1, { hasHitbox: true, hitboxHeight: TILE_SIZE });

    // Plants — interactable; opens choice dialogue
    const plantInteract = () => this.dialogueUI.startChoice(
      'Water the plant?',
      ['Yes', 'No'],
      (answer) => {
        this.dialogueUI.startDialogue(
          answer === 'Yes'
            ? ['You carefully water the plant.', 'It looks much happier now!']
            : ['Maybe later...']
        );
      }
    );
    const p1a = place('plant1', 17, 9,   this.playerY-1, { hasHitbox: true, hitboxHeight: TILE_SIZE / 2 });
    registerInteractable(p1a, plantInteract);
    const p1b = place('plant1', 0.5, 10, this.playerY-1, { hasHitbox: true, hitboxHeight: TILE_SIZE / 2 });
    registerInteractable(p1b, plantInteract);
    const p2  = place('plant2', 1,   1,  this.playerY-1, { hasHitbox: true, hitboxHeight: TILE_SIZE / 2 });
    registerInteractable(p2, plantInteract);

    // Photo frame — shows the photo in the modal
    const photoSprite = place('photoframe', 14, 0, this.playerY-1, { hasHitbox: false });
    registerInteractable(photoSprite, () => showModal({
      imageUrl: '/assets/images/first_date.jpg',
      title: 'Our First Adventure',
      text: 'A photo from the day everything started. Some memories are worth keeping forever.',
    }));
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

      // Furniture pixel-space collision
      for (const r of this.furnitureColliders) {
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return false;
      }
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
