# 📰 Chronicle — Modern Full-Stack Blog Platform with Comments

A complete, production-ready, responsive full-stack Blog Platform built with **HTML5, CSS3, JavaScript (ES6+), Node.js, Express.js, MongoDB / Mongoose**, secured with **JWT (JSON Web Tokens)** and **bcrypt** password hashing.

---

## ✨ Features

### 1. 🔐 User Registration & Authentication
- User signup with name, email, password, and custom bio.
- **Secure Password Hashing:** Powered by `bcryptjs` with salt rounds.
- **Stateless JWT Authentication:** Secure Bearer token issued upon login and stored in local client storage with token verification middleware.
- Current user profile endpoint (`GET /api/auth/me`) and live UI state synchronization.
- **1-Click Demo Logins:** Switch instantly between predefined demo authors (`Alex Rivera`, `Sophia Chen`, `Marcus Thorne`) to test multi-user authorization effortlessly.

### 2. 📊 Interactive Dashboard & Posts Feed
- Displays all published blog posts in responsive cards.
- **Card Metadata:** Cover image with smooth zoom, category badge, auto-calculated reading time (e.g. "3 min read"), title, summary excerpt, tags, author avatar, author name, publication date, and discussion comment counters.
- **Hero Banner:** Live counter metrics tracking total published stories, topics, and discussions.

### 3. ✍️ Create, Edit & Delete Blog Posts
- **Create Stories:** Form with title, category selector, tags (comma-separated), cover image URL with **5 instant Unsplash image presets**, summary excerpt, and content editor.
- **Markdown & Rich Content:** Live **Write / Preview** tab switcher supporting headings (`#`, `##`, `###`), bold (`**bold**`), italics (`*italic*`), code blocks (` ```js `), inline code (`` `code` ``), lists (`- `, `1. `), and blockquotes (`> quote`).
- **Strict Authorization:** Only the verified author of a blog post can edit (`PUT /api/posts/:id`) or delete (`DELETE /api/posts/:id`) it. Unauthorized requests are rejected with `403 Forbidden`.
- **Edit Modal:** Pre-populates all existing post data for seamless editing.
- **Safe Deletion:** Modal confirmation safeguards against accidental post deletion, with cascade cleanup of associated comments.

### 4. 💬 Interactive Comments Section
- Every blog post includes a dedicated discussion thread.
- Displays comments chronologically with author avatars, author names, relative timestamps ("2h ago", "Just now"), and content.
- Authenticated users can post comments directly using the rich comment box with character counter (up to 1,000 characters).
- **Comment Authorization:** Comment authors can delete their own comments (`DELETE /api/comments/:id`); unauthorized deletion attempts return `403 Forbidden`.
- Real-time comment counter updates on both the post details view and the dashboard cards.

### 5. 🔍 Real-Time Search & Multi-Filter Engine
- **Live Search Bar:** Instant debounced search querying across post titles, content, and tags. Keyboard shortcut `Ctrl+K` / `⌘K` instantly focuses search.
- **Category Filter Pills:** Filter by topics (`All`, `Technology`, `Design`, `Programming`, `AI & ML`, `DevOps`, `General`).
- **Tag Filtering:** Click any `#tag` badge on a post card or reading view to instantly filter posts by that tag.
- **"My Stories" View:** 1-click tab allowing logged-in authors to view and manage only their own publications.
- **Sorting Options:** Sort posts by *Latest First*, *Oldest First*, *Most Discussed*, or *Alphabetical (A-Z)*.
- **Active Filter Indicator:** Shows applied filters with a 1-click "Clear Filters" badge.

### 6. 🎨 Responsive & Modern UI / UX
- **Design Tokens:** Clean CSS custom properties for cohesive themes, shadows, transitions, and typography.
- **Dark Mode & Light Mode:** Seamless toggle with user preference persistence in `localStorage`.
- **Responsive Layout:** Optimized with CSS Grid and Flexbox for mobile, tablet, and widescreen desktop displays (down to 320px).
- **Mobile Drawer:** Slide-over navigation drawer for smaller screen viewports.
- **Toast Notifications:** Animated floating notifications for success, warning, info, and error alerts.
- **Modal Dialogs:** Accessible backdrop blur dialogs for post reading, story editor, authentication, and delete confirmations.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Semantic HTML5, Modern CSS3 (Custom Properties, Flexbox, Grid), Vanilla JavaScript (ES6+ Modules, Fetch API, DOM manipulation) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose ODM (includes an automatic zero-config embedded persistent adapter for environments without a local MongoDB service) |
| **Security & Auth** | JSON Web Tokens (`jsonwebtoken`), Password Hashing (`bcryptjs`), CORS (`cors`), Input Validation |
| **Testing** | Automated integration test suite (`test/api.test.js`) verifying 49 assertions |

---

## 📁 Project Structure

```
task4-blog-platform/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection & fallback resilience
│   ├── controllers/
│   │   ├── authController.js     # User registration, login, profile logic
│   │   ├── postController.js     # Post CRUD, query filtering, authorization
│   │   └── commentController.js  # Comment create, list, delete authorization
│   ├── middleware/
│   │   ├── auth.js               # JWT verification & optional auth middleware
│   │   └── errorHandler.js       # Centralized error handler & 404 handler
│   ├── models/
│   │   ├── User.js               # Mongoose User schema & password hooks
│   │   ├── Post.js               # Mongoose Post schema & read-time hooks
│   │   ├── Comment.js            # Mongoose Comment schema
│   │   ├── memoryStore.js        # Fallback persistent storage engine
│   │   └── index.js              # Unified data repository layer
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth routes
│   │   ├── postRoutes.js         # /api/posts routes
│   │   └── commentRoutes.js      # /api/comments routes
│   ├── utils/
│   │   └── seedData.js           # Sample users, showcase posts, and comments
│   └── server.js                 # Express server configuration & static host
├── frontend/
│   ├── css/
│   │   └── style.css             # Full modern design system, themes & animations
│   ├── js/
│   │   ├── api.js                # API HTTP client with JWT handling
│   │   ├── auth.js               # Authentication controller & nav UI sync
│   │   ├── comments.js           # Comment loader, poster, and deleter
│   │   ├── posts.js              # Posts renderer, filters, and editor modals
│   │   └── app.js                # App init, theme switcher, search & markdown
│   └── index.html                # Main responsive HTML interface
├── test/
│   └── api.test.js               # Automated integration test suite (49 checks)
├── .env                          # Local environment variables
├── .env.example                  # Example environment variables template
├── .gitignore                    # Git ignore file
├── package.json                  # NPM dependencies and scripts
└── README.md                     # Documentation
```

---

## 🚀 Installation & Execution

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Optional: if local MongoDB is not installed, the platform automatically switches to its embedded persistent store with zero configuration required!)

### 1. Clone or Navigate to Directory
```bash
cd task4-blog-platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` (already pre-configured with default values):
```bash
# Windows PowerShell:
Copy-Item .env.example .env

# Linux / macOS:
cp .env.example .env
```

Contents of `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/blog_platform
JWT_SECRET=supersecret_jwt_key_change_in_production_123456
JWT_EXPIRE=7d
```

### 4. Seed the Database
Populate the database with sample users, articles, and discussions:
```bash
npm run seed
```

### 5. Start the Application
```bash
npm start
```
The server will start at:
- **Web Application:** [http://localhost:5000](http://localhost:5000)
- **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 6. Run the Automated Test Suite
Run the 49-assertion automated API test suite:
```bash
npm test
```

---

## 👥 Demo User Accounts

You can use the **1-Click Demo Login** pills directly inside the app's login dialog or log in with these credentials:

| Name | Email | Password | Role / Focus |
|---|---|---|---|
| **Alex Rivera** | `alex@example.com` | `password123` | Full-stack Software Architect |
| **Sophia Chen** | `sophia@example.com` | `password123` | Design Systems Lead & UI/UX |
| **Marcus Thorne** | `marcus@example.com` | `password123` | Cloud & DevOps Engineer |

---

## 📡 RESTful API Reference

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user account (`name`, `email`, `password`, `bio`) |
| `POST` | `/api/auth/login` | Public | Login with `email` and `password`, returns JWT token |
| `GET` | `/api/auth/me` | Private | Retrieve authenticated user profile |
| `PUT` | `/api/auth/profile` | Private | Update user profile details |

#### Example: Register User
```http
POST /api/auth/register HTTP/1.1
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!",
  "bio": "Frontend developer and CSS artist."
}
```

### Posts Endpoints (`/api/posts`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/posts` | Public | Retrieve posts with `search`, `category`, `tag`, `author`, `sort`, `page` |
| `GET` | `/api/posts/:id` | Public | Retrieve single post by ID with author details |
| `POST` | `/api/posts` | Private | Create new blog post (`title`, `content`, `category`, `tags`, `coverImage`) |
| `PUT` | `/api/posts/:id` | Private (Author) | Update post (authorized author only) |
| `DELETE` | `/api/posts/:id` | Private (Author) | Delete post and cascade delete comments |

#### Example: Create Post
```http
POST /api/posts HTTP/1.1
Authorization: Bearer <YOUR_JWT_TOKEN>
Content-Type: application/json

{
  "title": "Mastering CSS Grid and Subgrid",
  "category": "Design",
  "tags": ["css", "frontend", "grid"],
  "coverImage": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80",
  "content": "CSS Grid provides bidirectional layout control across columns and rows..."
}
```

### Comments Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/posts/:postId/comments` | Public | Retrieve all comments for a post |
| `POST` | `/api/posts/:postId/comments` | Private | Add comment to a post |
| `DELETE` | `/api/comments/:id` | Private (Author) | Delete comment (comment author only) |

#### Example: Add Comment
```http
POST /api/posts/65f1234567890abcdef12345/comments HTTP/1.1
Authorization: Bearer <YOUR_JWT_TOKEN>
Content-Type: application/json

{
  "content": "Fantastic write-up! The visual examples were extremely clear."
}
```

---

## 🔒 Security & Authorization Highlights

1. **Password Safety:** Passwords are never stored in plaintext and never exposed in API query responses (`select: false` in Mongoose and sanitized in repository serialization).
2. **JWT Expiration:** Tokens are signed with a configurable expiration (`JWT_EXPIRE=7d`).
3. **Resource Ownership Authorization:**
   - When attempting `PUT /api/posts/:id` or `DELETE /api/posts/:id`, the system checks that `post.author === req.user._id`. Non-authors receive a `403 Forbidden` response.
   - When attempting `DELETE /api/comments/:id`, the system validates that `comment.author === req.user._id`. Non-authors receive a `403 Forbidden` response.
4. **Input Sanitization:** HTML escaping protects against cross-site scripting (XSS), and regex constraints validate email syntax.
5. **Centralized Error Handling:** All backend errors bubble up through custom Express error-handling middleware returning consistent `{ success: false, message: "..." }` responses.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
