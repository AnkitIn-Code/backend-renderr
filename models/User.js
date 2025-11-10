const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    required: true,
    enum: ['Admin', 'Editor', 'Viewer'],
    default: 'Viewer'
  },
  // Editor request workflow
  editorRequest: {
    status: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none'
    },
    requestedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);

// Enforce single Admin account: block creating another Admin
userSchema.pre('save', async function(next) {
  try {
    if (this.isModified('role') && this.role === 'Admin') {
      const count = await this.constructor.countDocuments({ role: 'Admin', _id: { $ne: this._id } });
      if (count > 0) {
        return next(new Error('Only one Admin account is allowed.'));
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.pre('findOneAndUpdate', async function(next) {
  try {
    const update = this.getUpdate() || {};
    const newRole = update.role || (update.$set && update.$set.role);
    if (newRole === 'Admin') {
      const filter = this.getQuery() || {};
      const id = filter._id;
      const count = await this.model.countDocuments({ role: 'Admin', ...(id ? { _id: { $ne: id } } : {}) });
      if (count > 0) {
        return next(new Error('Only one Admin account is allowed.'));
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

