const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Optional: if you want to know who wrote it
  author: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  // Optional: if you want to link review to a specific listing directly
  listing: {
    type: Schema.Types.ObjectId,
    ref: "Listing"
  }
});

module.exports = mongoose.model("Review", reviewSchema);
