const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['Admin', 'Editor', 'Viewer'],
    default: 'Viewer'
  },
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
}, { timestamps: true });

// Static method to get hardcoded admin email (convenience)
userSchema.statics.getAdminEmail = function() {
  return 'admin@yourdomain.com'; // change as needed
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