import Phaser from 'phaser';

/**
 * PhoneUI — full-screen phone image rendered inside the Phaser canvas.
 *
 * Usage (inside a Phaser scene):
 *   this.phoneUI = new PhoneUI(this);
 *   this.phoneUI.setImage('textureKey');
 *   this.phoneUI.setImages(['key1', 'key2', ...]);  — click to advance, loops
 *   this.phoneUI.show();
 *   this.phoneUI.hide();
 *   this.phoneUI.isActive()   — true while visible
 */

const GAME_WIDTH  = 640;
const GAME_HEIGHT = 660;

export class PhoneUI {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} [opts]
   * @param {number} [opts.depth=400]
   */
  constructor(scene, { depth = 400 } = {}) {
    this.scene = scene;
    this._keys  = [];
    this._index = 0;

    this._img = scene.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, '__DEFAULT')
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(depth)
      .setInteractive()
      .setVisible(false);

    this._img.on('pointerdown', () => {
      if (!this.isActive()) return;
      if (this._keys.length < 2) return;
      this._index = (this._index + 1) % this._keys.length;
      this._img.setTexture(this._keys[this._index]);
      this._applyScale();
    });

    // E key closes the phone (only while active)
    const eKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    eKey.on('down', () => {
      if (this.isActive()) this.hide();
    });
  }

  /** Set a single image (no click cycling). */
  setImage(textureKey) {
    this._keys  = [textureKey];
    this._index = 0;
    this._img.setTexture(textureKey);
    this._applyScale();
  }

  /** Set multiple images; click anywhere to advance (loops). */
  setImages(imageKeys) {
    this._keys  = imageKeys.slice();
    this._index = 0;
    this._img.setTexture(this._keys[0]);
    this._applyScale();
  }

  /** Scale down to fit screen; never upscale. Preserves aspect ratio. */
  _applyScale() {
    const sw = this.scene.scale.width;
    const sh = this.scene.scale.height;
    const iw = this._img.width;
    const ih = this._img.height;
    const scale = Math.min(1, sw / iw, sh / ih);
    this._img
      .setScale(scale)
      .setPosition(sw / 2, sh / 2);
  }

  show() {
    this._img.setVisible(true);
  }

  hide() {
    this._img.setVisible(false);
  }

  /** True while the phone screen is visible. */
  isActive() {
    return this._img.visible;
  }
}
