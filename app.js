const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
require('dotenv').config();
const mongoose = require('mongoose');

const Listing = require("./models/listing.js");
const Review = require("./models/review.js");

const app = express();


// MongoDB Connection
// With this:
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB Atlas"))
.catch(err => console.error("MongoDB Connection Error:", err));

async function main() {
  await mongoose.connect(MONGO_URL);
  console.log("✅ Connected to MongoDB");
}

// View Engine and Middleware Setup
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// =======================
// Routes
// =======================

// Home Route
app.get("/", async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
});

// Index - All Listings
app.get("/listings", async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
});

// New Listing Form
app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

// Create Listing
app.post("/listings", async (req, res) => {
  const newListing = new Listing(req.body.listing);
  await newListing.save();
  res.redirect("/listings");
});

// Show Listing Details (with reviews)
app.get("/listings/:id", async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id).populate("reviews");
  res.render("listings/show.ejs", { listing });
});

// Edit Listing Form
app.get("/listings/:id/edit", async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
});

// Update Listing
app.put("/listings/:id", async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  res.redirect(`/listings/${id}`);
});

// Delete Listing
app.delete("/listings/:id", async (req, res) => {
  const { id } = req.params;
  const deletedListing = await Listing.findByIdAndDelete(id);
  console.log("🗑️ Deleted:", deletedListing);
  res.redirect("/listings");
});

// Add Review to Listing
app.post("/listings/:id/review", async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  const newReview = new Review(req.body.review);

  listing.reviews.push(newReview);
  await newReview.save();
  await listing.save();

  console.log("📝 New Review:", newReview);
  res.redirect(`/listings/${listing._id}`);
});

// About Page
app.get("/about", (req, res) => {
  res.render("listings/about");
});

// Server Listening
app.listen(8080, () => {
  console.log("🚀 Server is running on http://localhost:8080");
});
const User = require("./models/user");

// ── Sign-Up ─────────────────────────────────────────
app.get("/signup", (req, res) => {
  res.render("auth/signup.ejs");
});

app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body.user;
    const user = new User({ email, password });
    await user.save();
    // TODO: create session / flash message
    res.redirect("/login");
  } catch (e) {
    console.error("Sign-up error:", e);
    res.render("auth/signup.ejs", { error: "Email already used." });
  }
});

// ── Log-In ─────────────────────────────────────────
app.get("/login", (req, res) => {
  res.render("auth/login.ejs");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body.user;
  const user = await User.findOne({ email });
  if (!user || !(await user.isValidPassword(password))) {
    return res.render("auth/login.ejs", { error: "Invalid credentials." });
  }
  // TODO: establish session here
  res.redirect("/listings");
});

