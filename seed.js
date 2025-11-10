const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Post = require('./models/Post');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rbac-app';

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Post.deleteMany({});
    console.log('Cleared existing data');

    // Create users - only one Admin account (predefined). Other sample users are optional.
    const adminUser = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'Admin'
    });

    const editorUser = new User({
      username: 'editor',
      email: 'editor@example.com',
      password: 'editor123',
      role: 'Editor'
    });

    const viewerUser = new User({
      username: 'viewer',
      email: 'viewer@example.com',
      password: 'viewer123',
      role: 'Viewer'
    });

    // Save users
    await adminUser.save();
    await editorUser.save();
    await viewerUser.save();
    console.log('Created users: admin, editor, viewer');

    // Create posts owned by editor
    const editorPosts = [
      {
        title: 'First Post by Editor',
        content: 'This is the first post created by the editor user. Editors can create and edit their own posts.',
        authorId: editorUser._id,
        isPublic: true
      },
      {
        title: 'Second Post by Editor',
        content: 'This is the second post by the editor. Notice how editors can manage their own content.',
        authorId: editorUser._id,
        isPublic: true
      },
      {
        title: 'Third Post by Editor',
        content: 'Another post showcasing editor capabilities. Only the owner or Admin can edit this.',
        authorId: editorUser._id,
        isPublic: false
      }
    ];

    const savedPosts = await Post.insertMany(editorPosts);
    console.log(`Created ${savedPosts.length} posts by editor`);

    // Create a post by admin
    const adminPost = new Post({
      title: 'Welcome Message from Admin',
      content: 'This is a post created by the admin. Admins have full access to all posts and can delete any post.',
      authorId: adminUser._id,
      isPublic: true
    });
    await adminPost.save();
    console.log('Created post by admin');

    console.log('\n✅ Seed completed successfully!');
    console.log('\nTest accounts:');
    console.log('Admin - Email: admin@example.com, Password: admin123');
    console.log('Editor - Email: editor@example.com, Password: editor123');
    console.log('Viewer - Email: viewer@example.com, Password: viewer123');
    console.log('\nClosing database connection...');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedDatabase();

