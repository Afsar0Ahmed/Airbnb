const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, // normalize
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  }
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // only hash if new or modified
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Validate password
userSchema.methods.isValidPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
