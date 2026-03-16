import Phaser from 'phaser';

/**
 * DialogueUI — an in-game dialogue box rendered inside the Phaser canvas.
 *
 * Usage (inside a Phaser scene):
 *   this.dialogue = new DialogueUI(this);
 *   this.dialogue.setText('Hello!');                      // instant, single line
 *   this.dialogue.startTyping('Hello!');                  // typewriter, single line
 *   this.dialogue.startDialogue(['Line 1', 'Line 2']);    // multi-line, X to advance
 *   this.dialogue.startChoice('Question?', ['A', 'B'],   // choice prompt
 *     (answer) => console.log(answer));
 *   this.dialogue.isActive()                              // true while box is open
 */

const BOX_HEIGHT    = 90;   // default height (px) for dialogue/typing mode
const LINE_HEIGHT   = 17;   // fontSize 13 + lineSpacing 4
const PADDING       = 14;
const GAME_WIDTH    = 640;
const GAME_HEIGHT   = 640;  // excludes the 20px HUD strip at the very bottom
const DEFAULT_SPEED = 40;   // characters per second

export class DialogueUI {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} [opts]
   * @param {number} [opts.depth=500]
   */
  constructor(scene, { depth = 500 } = {}) {
    this.scene = scene;

    // ── Internal state ────────────────────────────────────────────────────────
    this._typeTimer      = null;   // active TimerEvent while typing
    this._fullText       = '';     // full target text of the current line
    this._lines          = [];     // lines queued for startDialogue
    this._lineIndex      = 0;
    this._isWaiting      = false;  // finished typing, waiting for X to advance

    this._choiceActive   = false;
    this._choiceQuestion = '';
    this._choiceOptions  = [];
    this._choiceIndex    = 0;
    this._choiceCallback = null;

    // ── Background ────────────────────────────────────────────────────────────
    const boxY = GAME_HEIGHT - BOX_HEIGHT;

    this.bg = scene.add
      .rectangle(0, boxY, GAME_WIDTH, BOX_HEIGHT, 0x1a1a2e)
      .setOrigin(0, 0)
      .setDepth(depth)
      .setScrollFactor(0);

    this.border = scene.add
      .rectangle(0, boxY, GAME_WIDTH, BOX_HEIGHT)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x333333)
      .setDepth(depth - 1)
      .setScrollFactor(0);

    // ── Text ─────────────────────────────────────────────────────────────────
    this.label = scene.add
      .text(PADDING, boxY + PADDING, '', {
        fontSize: '13px',
        fontFamily: 'Courier New',
        color: '#eeeeee',
        wordWrap: { width: GAME_WIDTH - PADDING * 2 },
        lineSpacing: 4,
      })
      .setDepth(depth + 1)
      .setScrollFactor(0);

    // ── ▼ "waiting for input" indicator ──────────────────────────────────────
    this._arrow = scene.add
      .text(GAME_WIDTH - PADDING, GAME_HEIGHT - PADDING, '▼', {
        fontSize: '12px',
        fontFamily: 'Courier New',
        color: '#aaaaaa',
      })
      .setOrigin(1, 1)
      .setDepth(depth + 1)
      .setScrollFactor(0)
      .setVisible(false);

    // ── Key bindings ──────────────────────────────────────────────────────────
    const xKey    = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    const upKey   = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    const downKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);

    xKey.on('down', () => {
      if (this._choiceActive) {
        this._confirmChoice();
      } else if (this._typeTimer) {
        this._stopTyping();
        this.label.setText(this._fullText);
        this._onLineComplete();
      } else if (this._isWaiting) {
        this._advance();
      }
    });

    upKey.on('down', () => {
      if (!this._choiceActive) return;
      this._choiceIndex =
        (this._choiceIndex - 1 + this._choiceOptions.length) % this._choiceOptions.length;
      this._renderChoice();
    });

    downKey.on('down', () => {
      if (!this._choiceActive) return;
      this._choiceIndex =
        (this._choiceIndex + 1) % this._choiceOptions.length;
      this._renderChoice();
    });

    this.hide();
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Returns true while the box is open (typing, waiting, or choosing). */
  isActive() {
    return this.bg.visible;
  }

  show() {
    this.bg.setVisible(true);
    this.border.setVisible(true);
    this.label.setVisible(true);
  }

  hide() {
    this._stopTyping();
    this._isWaiting      = false;
    this._lines          = [];
    this._choiceActive   = false;
    this._choiceCallback = null;
    this._arrow.setVisible(false);
    this._resizeBox(BOX_HEIGHT); // restore default height
    this.bg.setVisible(false);
    this.border.setVisible(false);
    this.label.setVisible(false);
  }

  /** Show text instantly (no typewriter). */
  setText(text) {
    this._stopTyping();
    this._isWaiting = false;
    this._arrow.setVisible(false);
    this.label.setText(text);
  }

  /**
   * Reveal text one character at a time (single line, no auto-advance).
   * @param {string} text
   * @param {number} [speed] — chars/sec
   */
  startTyping(text, speed = DEFAULT_SPEED) {
    this._lines = [];
    this._startLine(text, speed);
  }

  /**
   * Type through an array of lines one by one.
   * X skips the current line, then advances. Box hides after the last line.
   * @param {string[]} lines
   * @param {number}   [speed] — chars/sec
   */
  startDialogue(lines, speed = DEFAULT_SPEED) {
    if (!lines || lines.length === 0) return;
    this._lines     = lines.slice();
    this._lineIndex = 0;
    this._startLine(this._lines[0], speed);
  }

  /**
   * Show a question with selectable options.
   * Arrow keys move the cursor; X confirms. The selected string is passed to callback.
   * @param {string}   question
   * @param {string[]} options
   * @param {function} callback — called with the chosen option string
   */
  startChoice(question, options, callback) {
    this._stopTyping();
    this._isWaiting      = false;
    this._lines          = [];
    this._choiceActive   = true;
    this._choiceQuestion = question;
    this._choiceOptions  = options.slice();
    this._choiceIndex    = 0;
    this._choiceCallback = callback;

    // Resize box to fit: question + options, minimum BOX_HEIGHT
    const needed = PADDING * 2 + (1 + options.length) * LINE_HEIGHT;
    this._resizeBox(Math.max(BOX_HEIGHT, needed));

    this._renderChoice();
    this.show();
  }

  // ── Internal helpers ────────────────────────────────────────────────────────

  _startLine(text, speed = DEFAULT_SPEED) {
    this._stopTyping();
    this._isWaiting = false;
    this._arrow.setVisible(false);
    this._fullText = text;
    this.label.setText('');
    this.show();

    let index = 0;
    this._typeTimer = this.scene.time.addEvent({
      delay: 1000 / speed,
      repeat: text.length - 1,
      callback: () => {
        index++;
        this.label.setText(text.slice(0, index));
        if (index === text.length) {
          this._typeTimer = null;
          this._onLineComplete();
        }
      },
    });
  }

  _onLineComplete() {
    if (this._lines.length > 0) {
      this._isWaiting = true;
      this._arrow.setVisible(true);
    }
  }

  _advance() {
    this._isWaiting = false;
    this._arrow.setVisible(false);
    this._lineIndex++;
    if (this._lineIndex < this._lines.length) {
      this._startLine(this._lines[this._lineIndex]);
    } else {
      this.hide();
    }
  }

  _renderChoice() {
    const lines = [this._choiceQuestion];
    this._choiceOptions.forEach((opt, i) => {
      lines.push((i === this._choiceIndex ? '► ' : '  ') + opt);
    });
    this.label.setText(lines.join('\n'));
  }

  _confirmChoice() {
    const selected = this._choiceOptions[this._choiceIndex];
    const cb = this._choiceCallback;
    this.hide();
    cb(selected);
  }

  _stopTyping() {
    if (this._typeTimer) {
      this._typeTimer.remove(false);
      this._typeTimer = null;
    }
  }

  /** Resize bg + border and reposition the text label. */
  _resizeBox(h) {
    const boxY = GAME_HEIGHT - h;
    this.bg.setPosition(0, boxY).setSize(GAME_WIDTH, h);
    this.border.setPosition(0, boxY).setSize(GAME_WIDTH, h);
    this.label.setPosition(PADDING, boxY + PADDING);
  }
}
