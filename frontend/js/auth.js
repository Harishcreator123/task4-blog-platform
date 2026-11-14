// ==========================================================================
// Authentication State & UI Controller
// ==========================================================================

const Auth = {
  currentUser: null,

  async init() {
    const token = window.api.getToken();
    if (token) {
      try {
        const res = await window.api.getMe();
        if (res.success && res.user) {
          this.currentUser = res.user;
        } else {
          this.logout();
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err.message);
        this.logout();
      }
    }
    this.updateUI();
    this.bindEvents();
  },

  isLoggedIn() {
    return !!this.currentUser;
  },

  getUser() {
    return this.currentUser;
  },

  getUserId() {
    return this.currentUser ? (this.currentUser._id || this.currentUser.id) : null;
  },

  updateUI() {
    const guestNav = document.getElementById('authGuestNav');
    const userNav = document.getElementById('authUserNav');
    const navMyPostsBtn = document.getElementById('navMyPostsBtn');
    const drawerUserInfo = document.getElementById('drawerUserInfo');
    const drawerMyPostsBtn = document.getElementById('drawerMyPostsBtn');
    const drawerWriteBtn = document.getElementById('drawerWriteBtn');
    const drawerAuthGuest = document.getElementById('drawerAuthGuest');
    const drawerLogoutBtn = document.getElementById('drawerLogoutBtn');
    const commentFormWrapper = document.getElementById('commentFormWrapper');
    const commentGuestPrompt = document.getElementById('commentGuestPrompt');

    if (this.isLoggedIn()) {
      // Authenticated view
      if (guestNav) guestNav.style.display = 'none';
      if (userNav) userNav.style.display = 'flex';
      if (navMyPostsBtn) navMyPostsBtn.style.display = 'inline-block';

      // Update Nav User Info
      const navAvatar = document.getElementById('navUserAvatar');
      const navName = document.getElementById('navUserName');
      const dropName = document.getElementById('dropdownFullName');
      const dropEmail = document.getElementById('dropdownEmail');

      if (navAvatar) navAvatar.src = this.currentUser.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user';
      if (navName) navName.textContent = this.currentUser.name;
      if (dropName) dropName.textContent = this.currentUser.name;
      if (dropEmail) dropEmail.textContent = this.currentUser.email;

      // Update Mobile Drawer
      if (drawerUserInfo) drawerUserInfo.style.display = 'flex';
      if (drawerMyPostsBtn) drawerMyPostsBtn.style.display = 'block';
      if (drawerWriteBtn) drawerWriteBtn.style.display = 'block';
      if (drawerAuthGuest) drawerAuthGuest.style.display = 'none';
      if (drawerLogoutBtn) drawerLogoutBtn.style.display = 'block';

      const drawerAvatar = document.getElementById('drawerUserAvatar');
      const drawerName = document.getElementById('drawerUserName');
      const drawerEmail = document.getElementById('drawerUserEmail');
      if (drawerAvatar) drawerAvatar.src = this.currentUser.avatar || '';
      if (drawerName) drawerName.textContent = this.currentUser.name;
      if (drawerEmail) drawerEmail.textContent = this.currentUser.email;

      // Update Comment Form
      if (commentFormWrapper) commentFormWrapper.style.display = 'flex';
      if (commentGuestPrompt) commentGuestPrompt.style.display = 'none';
      const commentAvatar = document.getElementById('commentFormAvatar');
      if (commentAvatar) commentAvatar.src = this.currentUser.avatar || '';
    } else {
      // Guest view
      if (guestNav) guestNav.style.display = 'flex';
      if (userNav) userNav.style.display = 'none';
      if (navMyPostsBtn) navMyPostsBtn.style.display = 'none';

      if (drawerUserInfo) drawerUserInfo.style.display = 'none';
      if (drawerMyPostsBtn) drawerMyPostsBtn.style.display = 'none';
      if (drawerWriteBtn) drawerWriteBtn.style.display = 'none';
      if (drawerAuthGuest) drawerAuthGuest.style.display = 'block';
      if (drawerLogoutBtn) drawerLogoutBtn.style.display = 'none';

      if (commentFormWrapper) commentFormWrapper.style.display = 'none';
      if (commentGuestPrompt) commentGuestPrompt.style.display = 'block';
    }
  },

  async login(email, password) {
    try {
      const res = await window.api.login({ email, password });
      this.currentUser = res.user;
      this.updateUI();
      this.closeModal();
      window.showToast(`Welcome back, ${res.user.name}!`, 'success');
      
      // Refresh current posts view
      if (window.Posts) {
        window.Posts.loadPosts();
      }
      return res;
    } catch (err) {
      window.showToast(err.message || 'Login failed', 'error');
      throw err;
    }
  },

  async register(name, email, password, bio, avatar) {
    try {
      const res = await window.api.register({ name, email, password, bio, avatar });
      this.currentUser = res.user;
      this.updateUI();
      this.closeModal();
      window.showToast(`Account created! Welcome, ${res.user.name}.`, 'success');
      
      // Refresh current posts view
      if (window.Posts) {
        window.Posts.loadPosts();
      }
      return res;
    } catch (err) {
      window.showToast(err.message || 'Registration failed', 'error');
      throw err;
    }
  },

  logout() {
    window.api.setToken(null);
    this.currentUser = null;
    this.updateUI();
    
    // Close any open menus
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) userDropdown.classList.remove('show');
    
    window.showToast('You have been logged out.', 'info');
    
    // Refresh posts if viewing "My Stories"
    if (window.Posts) {
      if (window.Posts.activeAuthor) {
        window.Posts.activeAuthor = null;
        const allBtn = document.getElementById('navAllPostsBtn');
        if (allBtn) allBtn.classList.add('active');
        const myBtn = document.getElementById('navMyPostsBtn');
        if (myBtn) myBtn.classList.remove('active');
      }
      window.Posts.loadPosts();
    }
  },

  openModal(tab = 'login') {
    const modal = document.getElementById('authModal');
    if (!modal) return;

    this.switchTab(tab);
    modal.classList.add('show');
  },

  closeModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.remove('show');
  },

  switchTab(tab) {
    const loginTab = document.getElementById('authLoginTab');
    const regTab = document.getElementById('authRegisterTab');
    const loginForm = document.getElementById('loginForm');
    const regForm = document.getElementById('registerForm');

    if (tab === 'login') {
      if (loginTab) loginTab.classList.add('active');
      if (regTab) regTab.classList.remove('active');
      if (loginForm) loginForm.style.display = 'block';
      if (regForm) regForm.style.display = 'none';
    } else {
      if (loginTab) loginTab.classList.remove('active');
      if (regTab) regTab.classList.add('active');
      if (loginForm) loginForm.style.display = 'none';
      if (regForm) regForm.style.display = 'block';
    }
  },

  bindEvents() {
    // Open Auth Modal Buttons
    const openLoginBtn = document.getElementById('openLoginBtn');
    const openRegBtn = document.getElementById('openRegisterBtn');
    const drawerLoginBtn = document.getElementById('drawerLoginBtn');
    const drawerRegisterBtn = document.getElementById('drawerRegisterBtn');
    const promptLoginBtn = document.getElementById('promptLoginBtn');
    const promptRegisterBtn = document.getElementById('promptRegisterBtn');
    const closeAuthBtn = document.getElementById('closeAuthModalBtn');

    if (openLoginBtn) openLoginBtn.addEventListener('click', () => this.openModal('login'));
    if (openRegBtn) openRegBtn.addEventListener('click', () => this.openModal('register'));
    if (drawerLoginBtn) {
      drawerLoginBtn.addEventListener('click', () => {
        window.closeDrawer();
        this.openModal('login');
      });
    }
    if (drawerRegisterBtn) {
      drawerRegisterBtn.addEventListener('click', () => {
        window.closeDrawer();
        this.openModal('register');
      });
    }
    if (promptLoginBtn) promptLoginBtn.addEventListener('click', () => this.openModal('login'));
    if (promptRegisterBtn) promptRegisterBtn.addEventListener('click', () => this.openModal('register'));
    if (closeAuthBtn) closeAuthBtn.addEventListener('click', () => this.closeModal());

    // Tab buttons inside modal
    const loginTab = document.getElementById('authLoginTab');
    const regTab = document.getElementById('authRegisterTab');
    if (loginTab) loginTab.addEventListener('click', () => this.switchTab('login'));
    if (regTab) regTab.addEventListener('click', () => this.switchTab('register'));

    // 1-Click Demo Login Pills
    const demoPills = document.querySelectorAll('.demo-pill');
    demoPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const email = pill.getAttribute('data-email');
        const pass = pill.getAttribute('data-pass');
        const loginEmailInput = document.getElementById('loginEmail');
        const loginPassInput = document.getElementById('loginPassword');
        if (loginEmailInput) loginEmailInput.value = email;
        if (loginPassInput) loginPassInput.value = pass;
        this.login(email, pass);
      });
    });

    // Form Submissions
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const submitBtn = document.getElementById('loginSubmitBtn');

        try {
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing in...';
          }
          await this.login(email, password);
        } catch (err) {
          // Handled in login method
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In to Chronicle';
          }
        }
      });
    }

    const regForm = document.getElementById('registerForm');
    if (regForm) {
      regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const bio = document.getElementById('regBio').value.trim();
        const submitBtn = document.getElementById('registerSubmitBtn');

        try {
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating account...';
          }
          await this.register(name, email, password, bio);
        } catch (err) {
          // Handled in register method
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Free Account';
          }
        }
      });
    }

    // User Dropdown Menu Toggle
    const userAvatarBtn = document.getElementById('userAvatarBtn');
    const userDropdown = document.getElementById('userDropdown');
    if (userAvatarBtn && userDropdown) {
      userAvatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('show');
      });

      document.addEventListener('click', (e) => {
        if (!userAvatarBtn.contains(e.target) && !userDropdown.contains(e.target)) {
          userDropdown.classList.remove('show');
        }
      });
    }

    // Logout Handlers
    const logoutBtn = document.getElementById('logoutBtn');
    const drawerLogoutBtnEl = document.getElementById('drawerLogoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());
    if (drawerLogoutBtnEl) {
      drawerLogoutBtnEl.addEventListener('click', () => {
        window.closeDrawer();
        this.logout();
      });
    }

    // Dropdown Actions
    const dropdownMyPosts = document.getElementById('dropdownMyPosts');
    if (dropdownMyPosts) {
      dropdownMyPosts.addEventListener('click', () => {
        if (userDropdown) userDropdown.classList.remove('show');
        if (window.Posts) window.Posts.filterByMyPosts();
      });
    }

    const dropdownWritePost = document.getElementById('dropdownWritePost');
    if (dropdownWritePost) {
      dropdownWritePost.addEventListener('click', () => {
        if (userDropdown) userDropdown.classList.remove('show');
        if (window.Posts) window.Posts.openCreateModal();
      });
    }
  },
};

window.Auth = Auth;
