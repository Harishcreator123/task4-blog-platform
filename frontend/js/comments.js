// ==========================================================================
// Comments Section Controller
// ==========================================================================

const Comments = {
  currentPostId: null,

  async loadComments(postId) {
    this.currentPostId = postId;
    const commentsList = document.getElementById('commentsList');
    const commentCountEl = document.getElementById('modalCommentCount');

    if (!commentsList) return;

    commentsList.innerHTML = '<div style="text-align: center; padding: 1.5rem; color: var(--text-muted);">Loading discussion...</div>';

    try {
      const res = await window.api.getComments(postId);
      const comments = res.comments || [];

      if (commentCountEl) {
        commentCountEl.textContent = comments.length;
      }

      this.render(comments);
    } catch (err) {
      console.error('Failed to load comments:', err);
      commentsList.innerHTML = '<div style="color: var(--danger); text-align: center; padding: 1rem;">Failed to load comments.</div>';
    }
  },

  render(comments) {
    const listEl = document.getElementById('commentsList');
    if (!listEl) return;

    if (!comments || comments.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.95rem;">
          No comments yet. Be the first to share your perspective!
        </div>
      `;
      return;
    }

    const currentUserId = window.Auth.getUserId();

    listEl.innerHTML = comments
      .map((c) => {
        const author = c.author || {};
        const authorId = author._id || author;
        const isOwner = currentUserId && authorId.toString() === currentUserId.toString();
        const avatarUrl = author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(author.name || 'User')}`;
        const formattedTime = this.formatTime(c.createdAt);

        return `
          <div class="comment-card" data-comment-id="${c._id}">
            <img src="${avatarUrl}" alt="${this.escapeHtml(author.name || 'User')}" class="comment-avatar" />
            <div class="comment-content-box">
              <div class="comment-meta">
                <div>
                  <span class="comment-author-name">${this.escapeHtml(author.name || 'Anonymous')}</span>
                  <span class="comment-time"> • ${formattedTime}</span>
                </div>
                ${
                  isOwner
                    ? `
                    <button class="comment-delete-btn" title="Delete comment" onclick="Comments.confirmDelete('${c._id}')">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                    `
                    : ''
                }
              </div>
              <div class="comment-text">${this.escapeHtml(c.content)}</div>
            </div>
          </div>
        `;
      })
      .join('');
  },

  async handleAddComment(e) {
    e.preventDefault();
    if (!window.Auth.isLoggedIn()) {
      window.Auth.openModal('login');
      return;
    }

    const textarea = document.getElementById('commentInput');
    const submitBtn = document.getElementById('submitCommentBtn');
    const content = textarea ? textarea.value.trim() : '';

    if (!content) {
      window.showToast('Please enter comment text.', 'warning');
      return;
    }

    if (!this.currentPostId) {
      window.showToast('No post selected.', 'error');
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Posting...';
      }

      await window.api.addComment(this.currentPostId, content);

      textarea.value = '';
      const charCount = document.getElementById('commentCharCount');
      if (charCount) charCount.textContent = '0 / 1000';

      window.showToast('Comment published!', 'success');
      await this.loadComments(this.currentPostId);

      // Refresh post comment count in Posts list if available
      if (window.Posts) {
        window.Posts.updateCardCommentCount(this.currentPostId, 1);
      }
    } catch (err) {
      window.showToast(err.message || 'Failed to post comment', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Post Comment';
      }
    }
  },

  confirmDelete(commentId) {
    window.openDeleteModal(
      'Delete Comment',
      'Are you sure you want to delete this comment? This cannot be undone.',
      async () => {
        try {
          await window.api.deleteComment(commentId);
          window.showToast('Comment deleted.', 'info');
          await this.loadComments(this.currentPostId);

          if (window.Posts) {
            window.Posts.updateCardCommentCount(this.currentPostId, -1);
          }
        } catch (err) {
          window.showToast(err.message || 'Failed to delete comment', 'error');
        }
      }
    );
  },

  formatTime(dateString) {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 30) return `${diffDay}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  },

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  bindEvents() {
    const commentForm = document.getElementById('addCommentForm');
    const commentInput = document.getElementById('commentInput');
    const charCount = document.getElementById('commentCharCount');

    if (commentForm) {
      commentForm.addEventListener('submit', (e) => this.handleAddComment(e));
    }

    if (commentInput && charCount) {
      commentInput.addEventListener('input', () => {
        const len = commentInput.value.length;
        charCount.textContent = `${len} / 1000`;
      });
    }
  },
};

window.Comments = Comments;
