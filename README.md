# Fine-Grained Role-Based Access Control (RBAC) MERN Stack Application

A complete MERN stack application demonstrating fine-grained Role-Based Access Control (RBAC) with three roles: **Admin**, **Editor**, and **Viewer**.

## Features

- 🔐 **Authentication**: JWT-based authentication with secure password hashing
- 🛡️ **Authorization**: Fine-grained role-based access control
- 👥 **Three Roles**: Admin, Editor, Viewer with different permission levels
- 📝 **Post Management**: CRUD operations with ownership checks
- 🎨 **Modern UI**: Beautiful, responsive React frontend
- 🔒 **Route Guards**: Protected routes based on user roles
- ⚡ **Component-Level Guarding**: UI elements conditionally rendered based on permissions

## Project Structure

```
.
├── server.js                 # Express server entry point
├── package.json              # Backend dependencies
├── models/
│   ├── User.js              # User model with role field
│   └── Post.js              # Post model with authorId
├── middleware/
│   └── auth.js             # JWT verification, checkRole, checkOwnership
├── routes/
│   ├── auth.js             # Authentication routes (login, register, logout)
│   └── posts.js            # Post CRUD routes with authorization
├── seed.js                 # Database seeding script
├── client/
│   ├── package.json        # Frontend dependencies
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js          # Main app component with routing
│       ├── context/
│       │   └── AuthContext.js  # Authentication context provider
│       ├── components/
│       │   └── PrivateRoute.js  # Route guard component
│       └── pages/
│           ├── Login.js           # Login page
│           ├── Register.js         # Registration page
│           ├── PostList.js        # Posts list with conditional UI
│           └── AdminDashboard.js  # Admin-only dashboard
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Installation & Setup

### 1. Install Backend Dependencies

```bash
npm install
```

### 2. Install Frontend Dependencies

```bash
cd client
npm install
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rbac-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Start MongoDB

Make sure MongoDB is running on your system. If using MongoDB locally:

```bash
# Windows (if MongoDB is installed as a service, it should start automatically)
# Or start manually:
mongod

# macOS/Linux
sudo systemctl start mongod
# or
mongod
```

### 5. Seed the Database

Run the seed script to populate the database with test users:

```bash
npm run seed
```

This creates three test users:
- **Admin**: `admin@example.com` / `admin123`
- **Editor**: `editor@example.com` / `editor123`
- **Viewer**: `viewer@example.com` / `viewer123`

### 6. Start the Backend Server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend server will run on `http://localhost:5000`

### 7. Start the Frontend

Open a new terminal window:

```bash
cd client
npm start
```

The frontend will run on `http://localhost:3000`

## Role Permissions

### Viewer
- ✅ View all posts
- ❌ Create posts
- ❌ Edit posts
- ❌ Delete posts
- ❌ Access admin dashboard

### Editor
- ✅ View all posts
- ✅ Create posts
- ✅ Edit own posts only
- ❌ Edit other users' posts
- ❌ Delete posts
- ❌ Access admin dashboard

### Admin
- ✅ View all posts
- ✅ Create posts
- ✅ Edit any post (including posts they don't own)
- ✅ Delete any post
- ✅ Access admin dashboard

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user (protected)

### Posts

- `GET /api/posts` - List all posts (authenticated users)
- `GET /api/posts/:id` - Get single post (authenticated users)
- `POST /api/posts` - Create post (Admin, Editor only)
- `PUT /api/posts/:id` - Update post (Admin, or Editor if owner)
- `DELETE /api/posts/:id` - Delete post (Admin only)

## Frontend Routes

- `/login` - Login page
- `/register` - Registration page
- `/posts` - Posts list (authenticated users)
- `/admin` - Admin dashboard (Admin only)

## Testing the Application

1. **Login as Viewer**:
   - Email: `viewer@example.com`
   - Password: `viewer123`
   - Should only see posts, no create/edit/delete buttons

2. **Login as Editor**:
   - Email: `editor@example.com`
   - Password: `editor123`
   - Can create posts
   - Can edit only own posts (the 3 seeded posts)
   - Cannot delete posts
   - Cannot access `/admin`

3. **Login as Admin**:
   - Email: `admin@example.com`
   - Password: `admin123`
   - Can create, edit any post, and delete any post
   - Can access `/admin` dashboard

## Key Implementation Details

### Backend Authorization

1. **JWT Authentication**: Tokens include `userId` and `role`
2. **Role Middleware**: `checkRole('Admin', 'Editor')` validates user roles
3. **Ownership Middleware**: `checkOwnership('Post')` checks if user owns the resource (Admin bypasses)
4. **Middleware Chaining**: Routes combine multiple middleware for fine-grained control

### Frontend Authorization

1. **Auth Context**: Global state management for user authentication
2. **Route Guards**: `PrivateRoute` component protects routes
3. **Component-Level Guarding**: UI elements conditionally rendered based on `canEdit()` and `canDelete()` functions
4. **Tooltips**: Disabled buttons show helpful messages for restricted actions

## Security Features

- Password hashing with bcryptjs
- JWT tokens stored in HTTP-only cookies (and localStorage as backup)
- Role verification on both client and server
- Ownership checks for resource modification
- CORS configuration for secure cross-origin requests

## Development

### Backend Development

```bash
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development

```bash
cd client
npm start    # React development server with hot reload
```

## Production Deployment

1. Update `.env` with production values
2. Set `NODE_ENV=production`
3. Use a secure `JWT_SECRET`
4. Configure MongoDB Atlas or production MongoDB instance
5. Build the React app: `cd client && npm run build`
6. Serve the build folder with the Express server or use a separate static file server

## Technologies Used

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: React, React Router, Axios
- **Authentication**: JWT (JSON Web Tokens), bcryptjs
- **Styling**: CSS3 with modern gradients and responsive design

## UI Theme Notes

The frontend UI uses a small design system based on CSS variables defined in `client/src/styles/theme.css`.

- Palette: soft pastel gradient backgrounds, accessible text colors, and semantic colors for primary/success/danger
- Radii and shadows: consistent rounded corners and subtle elevation for cards and buttons
- Focus: clear focus ring for inputs and buttons for better accessibility
- Components: existing classNames (e.g., `create-btn`, `submit-btn`, `post-card`, `admin-card`, etc.) are mapped to the theme

How to tweak the theme:

1. Edit `:root` variables in `client/src/styles/theme.css` (e.g., `--primary`, `--nav-start`, `--nav-end`)
2. Global element rules (buttons, inputs, textarea) handle base states; page CSS only contains minor overrides
3. No backend or component logic was changed—only CSS was updated

## License

ISC

## Author

Built as a complete MERN stack RBAC implementation example.

