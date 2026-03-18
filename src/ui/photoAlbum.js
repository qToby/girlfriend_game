/**
 * PhotoAlbumUI — centered overlay for displaying a photo with a caption.
 *
 * Usage:
 *   const album = createPhotoAlbumUI()
 *   album.setPage(imageUrl, 'Caption text')   — single page
 *   album.setPages([{ image, text }, ...])    — multi-page
 *   album.show()      — shows album at current page (resets to page 0 on setPages)
 *   album.hide()
 *   album.nextPage()
 *   album.prevPage()
 *
 * Keyboard (only while open):
 *   ArrowLeft / ArrowRight — navigate pages
 *   E                      — close
 */

export function createPhotoAlbumUI() {
  // Backdrop
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.80);
    z-index: 200;
    align-items: center;
    justify-content: center;
  `;

  // Panel
  const panel = document.createElement('div');
  panel.style.cssText = `
    background: #1a1a2e;
    border: 3px solid #333333;
    border-radius: 8px;
    padding: 24px 24px 20px;
    max-width: 420px;
    width: 90%;
    font-family: 'Courier New', Courier, monospace;
    color: #eeeeee;
    text-align: center;
  `;

  // Photo
  const imgEl = document.createElement('img');
  imgEl.style.cssText = `
    max-width: 100%;
    max-height: 260px;
    border-radius: 4px;
    margin-bottom: 14px;
    display: block;
    object-fit: contain;
  `;

  // Caption
  const captionEl = document.createElement('p');
  captionEl.style.cssText = `
    margin: 0 0 10px;
    font-size: 13px;
    line-height: 1.6;
    color: #cccccc;
  `;

  // Page indicator  e.g. "1 / 5"
  const pageIndicator = document.createElement('span');
  pageIndicator.style.cssText = `
    font-size: 12px;
    color: #888888;
    display: none;
  `;

  panel.append(imgEl, captionEl, pageIndicator);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  // Click backdrop to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hide();
  });

  // ── State ────────────────────────────────────────────────────────────────
  let pages = [];
  let currentIndex = 0;

  function isOpen() {
    return overlay.style.display === 'flex';
  }

  function render() {
    const page = pages[currentIndex];
    if (!page) return;
    imgEl.src = page.image;
    captionEl.textContent = page.text;
    if (pages.length > 1) {
      pageIndicator.textContent = `${currentIndex + 1} / ${pages.length}`;
      pageIndicator.style.display = 'block';
    } else {
      pageIndicator.style.display = 'none';
    }
  }

  // ── Keyboard handler ─────────────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); nextPage(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prevPage(); }
    else if (e.key === 'e' || e.key === 'E') { hide(); }
  });

  // ── Public API ───────────────────────────────────────────────────────────
  function show() {
    overlay.style.display = 'flex';
  }

  function hide() {
    overlay.style.display = 'none';
  }

  function setPage(image, text) {
    pages = [{ image, text }];
    currentIndex = 0;
    render();
  }

  function setPages(newPages) {
    pages = newPages;
    currentIndex = 0;
    render();
  }

  function nextPage() {
    if (currentIndex < pages.length - 1) {
      currentIndex++;
      render();
    }
  }

  function prevPage() {
    if (currentIndex > 0) {
      currentIndex--;
      render();
    }
  }

  return { show, hide, isOpen, setPage, setPages, nextPage, prevPage };
}
