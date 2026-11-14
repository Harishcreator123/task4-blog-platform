// ==========================================================================
// Chronicle — Core App Initialization & Utility Engine
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initSearch();
  initModals();
  initDrawer();

  // Initialize Components
  if (window.Comments) window.Comments.bindEvents();
  if (window.Auth) await window.Auth.init();
  if (window.Posts) await window.Posts.init();

  console.log('🚀 Chronicle Blog Platform initialized successfully.');
});

// ==========================================================================
// Theme Management (Light / Dark)
// ==========================================================================

function initTheme() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem('chronicle_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  setTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      setTheme(next);
    });
  }
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('chronicle_theme', theme);
}

// ==========================================================================
// Search Input Handler (Debounced)
// ==========================================================================

function initSearch() {
  const searchInput = document.getElementById('headerSearchInput');
  if (!searchInput) return;

  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = e.target.value;
      if (window.Posts) {
        window.Posts.activeSearch = query;
        window.Posts.loadPosts();
      }
    }, 280);
  });

  // Global Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl+K or Cmd+K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }

    // Escape to close modals or drawer
    if (e.key === 'Escape') {
      closeAllModals();
      closeDrawer();
    }
  });
}

// ==========================================================================
// Mobile Drawer Controller
// ==========================================================================

function initDrawer() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const closeBtn = document.getElementById('closeDrawerBtn');
  const overlay = document.getElementById('mobileDrawerOverlay');

  if (menuBtn) menuBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeDrawer();
    });
  }
}

function openDrawer() {
  const overlay = document.getElementById('mobileDrawerOverlay');
  if (overlay) overlay.classList.add('show');
}

function closeDrawer() {
  const overlay = document.getElementById('mobileDrawerOverlay');
  if (overlay) overlay.classList.remove('show');
}

window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;

// ==========================================================================
// Modal Helpers & Backdrop Clicking
// ==========================================================================

function initModals() {
  const modalkeys = ['authModal', 'postEditorModal', 'postDetailModal', 'deleteConfirmModal'];

  modalkeys.forEach((id) => {
    const modal = document.getElementById(id);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('show');
        }
      });
    }
  });
}

function closeAllModals() {
  const openModals = document.querySelectorAll('.modal-backdrop.show');
  openModals.forEach((m) => m.classList.remove('show'));
}

// ==========================================================================
// Delete Confirmation Modal Helper
// ==========================================================================

let deleteConfirmCallback = null;

function openDeleteModal(title, message, onConfirm) {
  const modal = document.getElementById('deleteConfirmModal');
  const titleEl = document.getElementById('deleteConfirmTitle');
  const msgEl = document.getElementById('deleteConfirmMessage');
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  const cancelBtn = document.getElementById('cancelDeleteBtn');
  const closeBtn = document.getElementById('closeDeleteConfirmBtn');

  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;

  deleteConfirmCallback = onConfirm;

  const closeHandler = () => {
    if (modal) modal.classList.remove('show');
    deleteConfirmCallback = null;
  };

  if (cancelBtn) cancelBtn.onclick = closeHandler;
  if (closeBtn) closeBtn.onclick = closeHandler;

  if (confirmBtn) {
    confirmBtn.onclick = async () => {
      if (typeof deleteConfirmCallback === 'function') {
        confirmBtn.disabled = true;
        try {
          await deleteConfirmCallback();
        } finally {
          confirmBtn.disabled = false;
          closeHandler();
        }
      }
    };
  }

  if (modal) modal.classList.add('show');
}

window.openDeleteModal = openDeleteModal;

// ==========================================================================
// Toast Notification Engine
// ==========================================================================

function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ'}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-hiding');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 250);
  }, duration);
}

window.showToast = showToast;

// ==========================================================================
// Lightweight Zero-Dependency Markdown Parser
// ==========================================================================

function parseMarkdown(md) {
  if (!md) return '';

  let text = escapeHtml(md);

  // Fenced Code Blocks (```javascript ... ```)
  text = text.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang || 'plaintext'}">${code.trim()}</code></pre>`;
  });

  // Inline Code (`code`)
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headings
  text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Blockquotes
  text = text.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Bold & Italic
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Unordered Lists
  text = text.replace(/^\s*[-*]\s+(.*)$/gim, '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>)/gms, '<ul>$1</ul>');
  // Clean up nested ul duplicates
  text = text.replace(/<\/ul>\s*<ul>/g, '');

  // Ordered Lists
  text = text.replace(/^\s*\d+\.\s+(.*)$/gim, '<li>$1</li>');

  // Paragraphs
  const blocks = text.split(/\n{2,}/);
  text = blocks
    .map((block) => {
      block = block.trim();
      if (!block) return '';
      if (
        block.startsWith('<h1') ||
        block.startsWith('<h2') ||
        block.startsWith('<h3') ||
        block.startsWith('<pre') ||
        block.startsWith('<ul>') ||
        block.startsWith('<ol>') ||
        block.startsWith('<blockquote>')
      ) {
        return block;
      }
      return `<p>${block.replace(/\n/g, '<br />')}</p>`;
    })
    .join('\n');

  return text;
}

window.parseMarkdown = parseMarkdown;

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
