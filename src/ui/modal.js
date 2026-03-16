/**
 * HTML overlay modal — displayed on top of the game canvas.
 *
 * Usage:
 *   createModal()   — call once during scene creation
 *   showModal({ imageUrl, title, text })
 *   hideModal()
 *   isModalOpen()   — returns boolean
 */

let overlay, imgEl, titleEl, textEl;
let initialized = false;

export function createModal() {
  if (initialized) return;
  initialized = true;

  // Semi-transparent full-screen backdrop
  overlay = document.createElement('div');
  overlay.style.cssText = `
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    z-index: 100;
    align-items: center;
    justify-content: center;
  `;

  // Dialog box
  const box = document.createElement('div');
  box.style.cssText = `
    background: #1a1a2e;
    border: 3px solid #e94560;
    border-radius: 8px;
    padding: 28px 28px 22px;
    max-width: 420px;
    width: 90%;
    font-family: 'Courier New', Courier, monospace;
    color: #eeeeee;
    text-align: center;
  `;

  // Optional image
  imgEl = document.createElement('img');
  imgEl.style.cssText = `
    max-width: 100%;
    max-height: 220px;
    border-radius: 4px;
    margin-bottom: 14px;
    display: none;
    object-fit: cover;
  `;

  // Title
  titleEl = document.createElement('h2');
  titleEl.style.cssText = `
    margin: 0 0 10px;
    font-size: 18px;
    color: #e94560;
    letter-spacing: 0.5px;
  `;

  // Body text
  textEl = document.createElement('p');
  textEl.style.cssText = `
    margin: 0 0 20px;
    font-size: 13px;
    line-height: 1.6;
    color: #cccccc;
  `;

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close  [E]';
  closeBtn.style.cssText = `
    background: #e94560;
    color: #ffffff;
    border: none;
    padding: 8px 22px;
    border-radius: 4px;
    cursor: pointer;
    font-family: 'Courier New', Courier, monospace;
    font-size: 13px;
    letter-spacing: 0.5px;
  `;
  closeBtn.addEventListener('click', hideModal);

  box.append(imgEl, titleEl, textEl, closeBtn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // Click backdrop to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hideModal();
  });
}

export function showModal({ imageUrl, title, text }) {
  if (imageUrl) {
    imgEl.src = imageUrl;
    imgEl.style.display = 'block';
  } else {
    imgEl.style.display = 'none';
  }
  titleEl.textContent = title;
  textEl.textContent  = text;
  overlay.style.display = 'flex';
}

export function hideModal() {
  overlay.style.display = 'none';
}

export function isModalOpen() {
  return overlay?.style.display === 'flex';
}
