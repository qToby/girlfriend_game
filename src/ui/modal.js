/**
 * HTML overlay modal — displayed on top of the game canvas.
 *
 * Usage:
 *   createModal()                   — call once during scene creation
 *   showModal({ imageUrl, title, text })
 *   showBookModal(pages)            — pages: [{ title, text }, ...]
 *   hideModal()
 *   isModalOpen()                   — returns boolean
 */

let overlay, imgEl, titleEl, textEl, navEl, prevBtn, nextBtn, pageLabel;
let bookPages = [];
let currentPage = 0;
let initialized = false;

// Shared button style
const BTN_CSS = `
  background: #333333;
  color: #ffffff;
  border: none;
  padding: 8px 22px;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  letter-spacing: 0.5px;
`;

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
    border: 3px solid #333333;
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

  // ── Book page navigation (hidden outside book mode) ───────────────────────
  navEl = document.createElement('div');
  navEl.style.cssText = `
    display: none;
    align-items: center;
    justify-content: center;
    gap: 14px;
    margin-bottom: 16px;
  `;

  prevBtn = document.createElement('button');
  prevBtn.textContent = '◀ Prev';
  prevBtn.style.cssText = BTN_CSS + 'padding: 6px 14px;';
  prevBtn.addEventListener('click', () => {
    if (currentPage > 0) { currentPage--; renderBookPage(); }
  });

  pageLabel = document.createElement('span');
  pageLabel.style.cssText = `font-size: 12px; color: #888888;`;

  nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next ▶';
  nextBtn.style.cssText = BTN_CSS + 'padding: 6px 14px;';
  nextBtn.addEventListener('click', () => {
    if (currentPage < bookPages.length - 1) { currentPage++; renderBookPage(); }
  });

  navEl.append(prevBtn, pageLabel, nextBtn);

  // ── Close button ──────────────────────────────────────────────────────────
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close  [E]';
  closeBtn.style.cssText = BTN_CSS;
  closeBtn.addEventListener('click', hideModal);

  box.append(imgEl, titleEl, textEl, navEl, closeBtn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // Click backdrop to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hideModal();
  });
}

function renderBookPage() {
  const p = bookPages[currentPage];
  titleEl.textContent = p.title;
  textEl.textContent  = p.text;
  pageLabel.textContent = `${currentPage + 1} / ${bookPages.length}`;
  prevBtn.disabled = currentPage === 0;
  nextBtn.disabled = currentPage === bookPages.length - 1;
  prevBtn.style.opacity = prevBtn.disabled ? '0.4' : '1';
  nextBtn.style.opacity = nextBtn.disabled ? '0.4' : '1';
}

export function showModal({ imageUrl, title, text }) {
  navEl.style.display = 'none';
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

export function showBookModal(pages) {
  imgEl.style.display = 'none';
  bookPages = pages;
  currentPage = 0;
  navEl.style.display = 'flex';
  renderBookPage();
  overlay.style.display = 'flex';
}

export function hideModal() {
  overlay.style.display = 'none';
  navEl.style.display = 'none';
}

export function isModalOpen() {
  return overlay?.style.display === 'flex';
}
