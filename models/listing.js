const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review");

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    default: "/images/default-listing.jpg" // fallback image
  },
  location: {
    type: String,
    required: true
  },
  reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }]
});

// Cascade delete reviews when listing is deleted
listingSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await Review.deleteMany({ _id: { $in: doc.reviews } });
    console.log("🗑️ Deleted associated reviews for listing:", doc._id);
  }
});

module.exports = mongoose.model("Listing", listingSchema);
