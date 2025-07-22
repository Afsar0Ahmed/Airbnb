const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
  title: String,
  description: String,
  price: Number,
  image: String,
  location: String,
  reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }]
});

module.exports = mongoose.model("Listing", listingSchema);
