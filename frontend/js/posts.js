// ==========================================================================
// Posts Controller & UI Manager
// ==========================================================================

const Posts = {
  posts: [],
  activeCategory: 'All',
  activeSearch: '',
  activeTag: '',
  activeAuthor: null,
  activeSort: 'latest',
  currentDetailPost: null,

  async init() {
    this.bindEvents();
    await this.loadPosts();
  },

  async loadPosts() {
    const grid = document.getElementById('postsGrid');
    const skeleton = document.getElementById('postsLoadingGrid');
    const emptyState = document.getElementById('emptyState');
    const indicator = document.getElementById('postsCountIndicator');
    const filterBadge = document.getElementById('activeFilterBadge');
    const filterText = document.getElementById('activeFilterText');

    if (skeleton) skeleton.style.display = 'grid';
    if (grid) grid.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';

    try {
      const params = {
        sort: this.activeSort,
      };

      if (this.activeCategory && this.activeCategory !== 'All') {
        params.category = this.activeCategory;
      }
      if (this.activeSearch && this.activeSearch.trim()) {
        params.search = this.activeSearch.trim();
      }
      if (this.activeTag && this.activeTag.trim()) {
        params.tag = this.activeTag.trim();
      }
      if (this.activeAuthor) {
        params.author = this.activeAuthor;
      }

      const res = await window.api.getPosts(params);
      this.posts = res.posts || [];

      // Update Header Indicator & Badges
      let filterDesc = [];
      if (this.activeAuthor) filterDesc.push('My Stories');
      if (this.activeCategory !== 'All') filterDesc.push(`Topic: ${this.activeCategory}`);
      if (this.activeTag) filterDesc.push(`Tag: #${this.activeTag}`);
      if (this.activeSearch) filterDesc.push(`Search: "${this.activeSearch}"`);

      if (filterDesc.length > 0) {
        if (filterBadge && filterText) {
          filterBadge.style.display = 'inline-flex';
          filterText.textContent = filterDesc.join(' • ');
        }
        if (indicator) indicator.textContent = `${this.posts.length} result${this.posts.length === 1 ? '' : 's'} found`;
      } else {
        if (filterBadge) filterBadge.style.display = 'none';
        if (indicator) indicator.textContent = `Showing all stories (${this.posts.length})`;
      }

      // Update Hero Stats
      this.updateStats();

      // Render Grid or Empty State
      if (this.posts.length === 0) {
        if (grid) grid.style.display = 'none';
        if (emptyState) {
          emptyState.style.display = 'block';
          const emptyDesc = document.getElementById('emptyDescription');
          const emptyWriteBtn = document.getElementById('emptyWriteBtn');
          if (this.activeAuthor) {
            if (emptyDesc) emptyDesc.textContent = "You haven't published any stories yet. Start writing your first post!";
            if (emptyWriteBtn) emptyWriteBtn.style.display = 'inline-block';
          } else {
            if (emptyDesc) emptyDesc.textContent = "We couldn't find any articles matching your search criteria. Try a different query or topic filter.";
            if (emptyWriteBtn) emptyWriteBtn.style.display = 'none';
          }
        }
      } else {
        if (emptyState) emptyState.style.display = 'none';
        if (grid) {
          grid.style.display = 'grid';
          this.renderGrid(this.posts);
        }
      }
    } catch (err) {
      console.error('Error loading posts:', err);
      window.showToast('Failed to load posts from server', 'error');
    } finally {
      if (skeleton) skeleton.style.display = 'none';
    }
  },

  renderGrid(posts) {
    const grid = document.getElementById('postsGrid');
    if (!grid) return;

    const currentUserId = window.Auth.getUserId();

    grid.innerHTML = posts
      .map((post) => {
        const author = post.author || {};
        const authorId = author._id || author;
        const isOwner = currentUserId && authorId.toString() === currentUserId.toString();
        const authorName = author.name || 'Anonymous';
        const authorAvatar = author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authorName)}`;
        const formattedDate = this.formatDate(post.createdAt);
        const coverImg = post.coverImage || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80';

        const tagsHtml = (post.tags || [])
          .map((tag) => `<span class="tag-badge" onclick="event.stopPropagation(); Posts.filterByTag('${this.escapeHtml(tag)}')">#${this.escapeHtml(tag)}</span>`)
          .join('');

        return `
          <article class="post-card" data-post-id="${post._id}">
            <div class="card-image-box" onclick="Posts.openDetail('${post._id}')">
              <img src="${coverImg}" alt="${this.escapeHtml(post.title)}" class="card-image" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80'" />
              <div class="card-badges">
                <span class="category-badge">${this.escapeHtml(post.category || 'General')}</span>
                <span class="read-time-badge">${post.readTime || 1} min read</span>
              </div>
            </div>

            <div class="card-body">
              <h2 class="card-title" onclick="Posts.openDetail('${post._id}')">${this.escapeHtml(post.title)}</h2>
              <p class="card-excerpt">${this.escapeHtml(post.excerpt || '')}</p>

              ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ''}

              <div class="card-footer">
                <div class="card-author">
                  <img src="${authorAvatar}" alt="${this.escapeHtml(authorName)}" class="avatar-img" />
                  <div>
                    <span class="author-meta-name">${this.escapeHtml(authorName)}</span>
                    <span class="author-meta-date">${formattedDate}</span>
                  </div>
                </div>

                <div class="card-meta-right">
                  <div class="comment-counter" title="${post.commentCount || 0} comments">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span class="card-comment-num" data-post-id="${post._id}">${post.commentCount || 0}</span>
                  </div>

                  ${
                    isOwner
                      ? `
                      <div class="card-actions">
                        <button class="card-action-btn edit-btn" title="Edit story" onclick="event.stopPropagation(); Posts.openEditModal('${post._id}')">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                          </svg>
                        </button>
                        <button class="card-action-btn delete-btn" title="Delete story" onclick="event.stopPropagation(); Posts.confirmDelete('${post._id}')">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                      `
                      : ''
                  }
                </div>
              </div>
            </div>
          </article>
        `;
      })
      .join('');
  },

  async openDetail(postId) {
    try {
      const res = await window.api.getPostById(postId);
      const post = res.post;
      this.currentDetailPost = post;

      const modal = document.getElementById('postDetailModal');
      const catEl = document.getElementById('modalPostCategory');
      const readEl = document.getElementById('modalPostReadTime');
      const coverEl = document.getElementById('modalPostCover');
      const titleEl = document.getElementById('modalPostTitle');
      const authorAvatar = document.getElementById('modalAuthorAvatar');
      const authorName = document.getElementById('modalAuthorName');
      const authorBio = document.getElementById('modalAuthorBio');
      const dateEl = document.getElementById('modalPostDate');
      const tagsEl = document.getElementById('modalPostTags');
      const contentEl = document.getElementById('modalPostContent');
      const authorActions = document.getElementById('modalAuthorActions');

      if (catEl) catEl.textContent = post.category || 'General';
      if (readEl) readEl.textContent = `${post.readTime || 1} min read`;
      if (coverEl) coverEl.src = post.coverImage || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80';
      if (titleEl) titleEl.textContent = post.title;

      const author = post.author || {};
      const authorId = author._id || author;
      const authorNameText = author.name || 'Anonymous';
      if (authorAvatar) authorAvatar.src = author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authorNameText)}`;
      if (authorName) authorName.textContent = authorNameText;
      if (authorBio) authorBio.textContent = author.bio || 'Passionate writer and reader.';
      if (dateEl) dateEl.textContent = `Published on ${this.formatDate(post.createdAt, true)}`;

      // Render tags
      if (tagsEl) {
        tagsEl.innerHTML = (post.tags || [])
          .map((t) => `<span class="tag-badge" onclick="Posts.closeDetail(); Posts.filterByTag('${this.escapeHtml(t)}')">#${this.escapeHtml(t)}</span>`)
          .join('');
      }

      // Render Markdown / Text content
      if (contentEl) {
        contentEl.innerHTML = window.parseMarkdown(post.content);
      }

      // Check author authorization for modal action buttons
      const currentUserId = window.Auth.getUserId();
      const isOwner = currentUserId && authorId.toString() === currentUserId.toString();
      if (authorActions) {
        authorActions.style.display = isOwner ? 'flex' : 'none';
      }

      // Load comments
      if (window.Comments) {
        await window.Comments.loadComments(postId);
      }

      if (modal) modal.classList.add('show');
    } catch (err) {
      window.showToast('Failed to open story details', 'error');
    }
  },

  closeDetail() {
    const modal = document.getElementById('postDetailModal');
    if (modal) modal.classList.remove('show');
    this.currentDetailPost = null;
  },

  openCreateModal() {
    if (!window.Auth.isLoggedIn()) {
      window.showToast('Please log in or create an account to write a story.', 'info');
      window.Auth.openModal('login');
      return;
    }

    const modal = document.getElementById('postEditorModal');
    const title = document.getElementById('postEditorTitle');
    const form = document.getElementById('postEditorForm');
    const idInput = document.getElementById('editorPostId');

    if (form) form.reset();
    if (idInput) idInput.value = '';
    if (title) title.textContent = 'Create New Story';

    const saveBtn = document.getElementById('savePostBtn');
    if (saveBtn) saveBtn.textContent = 'Publish Story';

    this.switchEditorTab('write');
    if (modal) modal.classList.add('show');
  },

  async openEditModal(postId) {
    if (!window.Auth.isLoggedIn()) {
      window.Auth.openModal('login');
      return;
    }

    try {
      const res = await window.api.getPostById(postId);
      const post = res.post;

      const currentUserId = window.Auth.getUserId();
      const authorId = post.author?._id || post.author;
      if (authorId.toString() !== currentUserId.toString()) {
        window.showToast('You can only edit your own stories.', 'error');
        return;
      }

      const modal = document.getElementById('postEditorModal');
      const title = document.getElementById('postEditorTitle');
      const idInput = document.getElementById('editorPostId');
      const titleInput = document.getElementById('postTitleInput');
      const catSelect = document.getElementById('postCategorySelect');
      const tagsInput = document.getElementById('postTagsInput');
      const coverInput = document.getElementById('postCoverInput');
      const excerptInput = document.getElementById('postExcerptInput');
      const contentInput = document.getElementById('postContentInput');
      const saveBtn = document.getElementById('savePostBtn');

      if (idInput) idInput.value = post._id;
      if (titleInput) titleInput.value = post.title;
      if (catSelect) catSelect.value = post.category || 'General';
      if (tagsInput) tagsInput.value = (post.tags || []).join(', ');
      if (coverInput) coverInput.value = post.coverImage || '';
      if (excerptInput) excerptInput.value = post.excerpt || '';
      if (contentInput) contentInput.value = post.content || '';

      if (title) title.textContent = 'Edit Story';
      if (saveBtn) saveBtn.textContent = 'Save Changes';

      this.switchEditorTab('write');
      if (modal) modal.classList.add('show');
    } catch (err) {
      window.showToast(err.message || 'Failed to open story for editing', 'error');
    }
  },

  closeEditorModal() {
    const modal = document.getElementById('postEditorModal');
    if (modal) modal.classList.remove('show');
  },

  async handleSavePost(e) {
    e.preventDefault();
    if (!window.Auth.isLoggedIn()) {
      window.Auth.openModal('login');
      return;
    }

    const idInput = document.getElementById('editorPostId');
    const titleInput = document.getElementById('postTitleInput');
    const catSelect = document.getElementById('postCategorySelect');
    const tagsInput = document.getElementById('postTagsInput');
    const coverInput = document.getElementById('postCoverInput');
    const excerptInput = document.getElementById('postExcerptInput');
    const contentInput = document.getElementById('postContentInput');
    const saveBtn = document.getElementById('savePostBtn');

    const postId = idInput ? idInput.value : '';
    const isEdit = !!postId;

    const payload = {
      title: titleInput ? titleInput.value.trim() : '',
      category: catSelect ? catSelect.value : 'General',
      tags: tagsInput ? tagsInput.value.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
      coverImage: coverInput ? coverInput.value.trim() : undefined,
      excerpt: excerptInput ? excerptInput.value.trim() : undefined,
      content: contentInput ? contentInput.value.trim() : '',
    };

    if (!payload.title || payload.title.length < 3) {
      window.showToast('Title must be at least 3 characters.', 'warning');
      return;
    }

    if (!payload.content || payload.content.length < 10) {
      window.showToast('Content must be at least 10 characters.', 'warning');
      return;
    }

    try {
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = isEdit ? 'Saving...' : 'Publishing...';
      }

      if (isEdit) {
        await window.api.updatePost(postId, payload);
        window.showToast('Story updated successfully!', 'success');
        if (this.currentDetailPost && this.currentDetailPost._id === postId) {
          await this.openDetail(postId);
        }
      } else {
        await window.api.createPost(payload);
        window.showToast('Story published successfully!', 'success');
      }

      this.closeEditorModal();
      await this.loadPosts();
    } catch (err) {
      window.showToast(err.message || 'Failed to save story', 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = isEdit ? 'Save Changes' : 'Publish Story';
      }
    }
  },

  confirmDelete(postId) {
    window.openDeleteModal(
      'Delete Story',
      'Are you sure you want to permanently delete this story and all of its comments? This cannot be undone.',
      async () => {
        try {
          await window.api.deletePost(postId);
          window.showToast('Story deleted successfully.', 'info');
          this.closeDetail();
          await this.loadPosts();
        } catch (err) {
          window.showToast(err.message || 'Failed to delete story', 'error');
        }
      }
    );
  },

  updateCardCommentCount(postId, delta) {
    const numEl = document.querySelector(`.card-comment-num[data-post-id="${postId}"]`);
    if (numEl) {
      const current = parseInt(numEl.textContent, 10) || 0;
      numEl.textContent = Math.max(0, current + delta);
    }
    const modalCount = document.getElementById('modalCommentCount');
    if (modalCount) {
      const current = parseInt(modalCount.textContent, 10) || 0;
      modalCount.textContent = Math.max(0, current + delta);
    }
    this.updateStats();
  },

  updateStats() {
    const totalPostsEl = document.getElementById('statsTotalPosts');
    const discussionsEl = document.getElementById('statsDiscussions');

    if (totalPostsEl) {
      totalPostsEl.textContent = this.posts.length;
    }

    if (discussionsEl) {
      const totalComments = this.posts.reduce((sum, p) => sum + (p.commentCount || 0), 0);
      discussionsEl.textContent = totalComments;
    }
  },

  switchCategory(category) {
    this.activeCategory = category;
    this.activeTag = '';
    const pills = document.querySelectorAll('.category-pills .pill');
    pills.forEach((p) => {
      if (p.getAttribute('data-category').toLowerCase() === category.toLowerCase()) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });
    this.loadPosts();
  },

  filterByTag(tag) {
    this.activeTag = tag;
    this.loadPosts();
  },

  filterByMyPosts() {
    if (!window.Auth.isLoggedIn()) {
      window.Auth.openModal('login');
      return;
    }
    this.activeAuthor = window.Auth.getUserId();
    const allBtn = document.getElementById('navAllPostsBtn');
    const myBtn = document.getElementById('navMyPostsBtn');
    if (allBtn) allBtn.classList.remove('active');
    if (myBtn) myBtn.classList.add('active');
    this.loadPosts();
  },

  filterByAllPosts() {
    this.activeAuthor = null;
    const allBtn = document.getElementById('navAllPostsBtn');
    const myBtn = document.getElementById('navMyPostsBtn');
    if (allBtn) allBtn.classList.add('active');
    if (myBtn) myBtn.classList.remove('active');
    this.loadPosts();
  },

  clearAllFilters() {
    this.activeCategory = 'All';
    this.activeSearch = '';
    this.activeTag = '';
    this.activeAuthor = null;

    const searchInput = document.getElementById('headerSearchInput');
    if (searchInput) searchInput.value = '';

    const allBtn = document.getElementById('navAllPostsBtn');
    const myBtn = document.getElementById('navMyPostsBtn');
    if (allBtn) allBtn.classList.add('active');
    if (myBtn) myBtn.classList.remove('active');

    const pills = document.querySelectorAll('.category-pills .pill');
    pills.forEach((p) => {
      if (p.getAttribute('data-category') === 'All') p.classList.add('active');
      else p.classList.remove('active');
    });

    this.loadPosts();
  },

  switchEditorTab(tab) {
    const writeTab = document.getElementById('editorWriteTab');
    const previewTab = document.getElementById('editorPreviewTab');
    const writeArea = document.getElementById('editorWriteArea');
    const previewArea = document.getElementById('editorPreviewArea');
    const contentInput = document.getElementById('postContentInput');

    if (tab === 'write') {
      if (writeTab) writeTab.classList.add('active');
      if (previewTab) previewTab.classList.remove('active');
      if (writeArea) writeArea.style.display = 'block';
      if (previewArea) previewArea.style.display = 'none';
    } else {
      if (writeTab) writeTab.classList.remove('active');
      if (previewTab) previewTab.classList.add('active');
      if (writeArea) writeArea.style.display = 'none';
      if (previewArea) {
        previewArea.style.display = 'block';
        const content = contentInput ? contentInput.value : '';
        previewArea.innerHTML = window.parseMarkdown(content || '*No content to preview*');
      }
    }
  },

  formatDate(dateString, full = false) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (full) {
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
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
    // Navigation Links
    const allPostsBtn = document.getElementById('navAllPostsBtn');
    const myPostsBtn = document.getElementById('navMyPostsBtn');
    const logoLink = document.getElementById('logoLink');
    const navWriteBtn = document.getElementById('navWritePostBtn');
    const drawerExploreBtn = document.getElementById('drawerExploreBtn');
    const drawerMyPostsBtn = document.getElementById('drawerMyPostsBtn');
    const drawerWriteBtn = document.getElementById('drawerWriteBtn');

    if (allPostsBtn) allPostsBtn.addEventListener('click', () => this.filterByAllPosts());
    if (myPostsBtn) myPostsBtn.addEventListener('click', () => this.filterByMyPosts());
    if (logoLink) {
      logoLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.clearAllFilters();
      });
    }
    if (navWriteBtn) navWriteBtn.addEventListener('click', () => this.openCreateModal());

    if (drawerExploreBtn) {
      drawerExploreBtn.addEventListener('click', () => {
        window.closeDrawer();
        this.filterByAllPosts();
      });
    }
    if (drawerMyPostsBtn) {
      drawerMyPostsBtn.addEventListener('click', () => {
        window.closeDrawer();
        this.filterByMyPosts();
      });
    }
    if (drawerWriteBtn) {
      drawerWriteBtn.addEventListener('click', () => {
        window.closeDrawer();
        this.openCreateModal();
      });
    }

    // Category Pills
    const pillsContainer = document.getElementById('categoryPills');
    if (pillsContainer) {
      pillsContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.pill');
        if (pill) {
          const category = pill.getAttribute('data-category');
          this.switchCategory(category);
        }
      });
    }

    // Clear filter buttons
    const clearFilterBtn = document.getElementById('clearFilterBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const emptyWriteBtn = document.getElementById('emptyWriteBtn');

    if (clearFilterBtn) clearFilterBtn.addEventListener('click', () => this.clearAllFilters());
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', () => this.clearAllFilters());
    if (emptyWriteBtn) emptyWriteBtn.addEventListener('click', () => this.openCreateModal());

    // Sort Dropdown
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.activeSort = e.target.value;
        this.loadPosts();
      });
    }

    // Post Editor Modal Controls
    const closeEditorBtn = document.getElementById('closePostEditorBtn');
    const cancelEditorBtn = document.getElementById('cancelPostEditorBtn');
    const editorForm = document.getElementById('postEditorForm');
    const writeTab = document.getElementById('editorWriteTab');
    const previewTab = document.getElementById('editorPreviewTab');

    if (closeEditorBtn) closeEditorBtn.addEventListener('click', () => this.closeEditorModal());
    if (cancelEditorBtn) cancelEditorBtn.addEventListener('click', () => this.closeEditorModal());
    if (editorForm) editorForm.addEventListener('submit', (e) => this.handleSavePost(e));
    if (writeTab) writeTab.addEventListener('click', () => this.switchEditorTab('write'));
    if (previewTab) previewTab.addEventListener('click', () => this.switchEditorTab('preview'));

    // Image presets in Editor
    const presetBadges = document.querySelectorAll('.preset-badge');
    presetBadges.forEach((badge) => {
      badge.addEventListener('click', () => {
        const url = badge.getAttribute('data-url');
        const coverInput = document.getElementById('postCoverInput');
        if (coverInput) coverInput.value = url;
      });
    });

    // Detail Modal Controls
    const closeDetailBtn = document.getElementById('closePostModalBtn');
    const modalEditBtn = document.getElementById('modalEditPostBtn');
    const modalDeleteBtn = document.getElementById('modalDeletePostBtn');

    if (closeDetailBtn) closeDetailBtn.addEventListener('click', () => this.closeDetail());
    if (modalEditBtn) {
      modalEditBtn.addEventListener('click', () => {
        if (this.currentDetailPost) {
          const id = this.currentDetailPost._id;
          this.closeDetail();
          this.openEditModal(id);
        }
      });
    }
    if (modalDeleteBtn) {
      modalDeleteBtn.addEventListener('click', () => {
        if (this.currentDetailPost) {
          this.confirmDelete(this.currentDetailPost._id);
        }
      });
    }
  },
};

window.Posts = Posts;
