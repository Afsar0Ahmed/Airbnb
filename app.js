const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const bcrypt = require("bcryptjs");

const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const User = require("./models/User"); // ✅ clean import

const app = express();

// ======================
// MongoDB Connection
// ======================
// ======================
// MongoDB Connection
// ======================
const MONGO_URL =
  process.env.MONGO_URL || "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
  try {
    // Mongoose 8+ doesn't need useNewUrlParser or useUnifiedTopology
    await mongoose.connect(MONGO_URL);

    console.log("✅ Connected to MongoDB");

    // Start server only after DB is connected
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);

    // Optional: exit app if DB fails
    process.exit(1);
  }
}

main();


// ======================
// View Engine & Middleware
// ======================
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// =======================
// Routes
// =======================

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

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

// Show Listing Details
app.get("/listings/:id", async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id).populate("reviews");
  if (!listing) return res.status(404).send("Listing not found");
  res.render("listings/show.ejs", { listing });
});

// Edit Listing Form
app.get("/listings/:id/edit", async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) return res.status(404).send("Listing not found");
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
  if (!listing) return res.status(404).send("Listing not found");

  const newReview = new Review(req.body.review);
  listing.reviews.push(newReview);

  await newReview.save();
  await listing.save();

  console.log("📝 New Review:", newReview);
  res.redirect(`/listings/${listing._id}`);
});

// About Page
// About Page
app.get("/about", async (req, res) => {
  try {
    const allListings = await Listing.find({});
    res.render("listings/about", { allListings });
  } catch (err) {
    console.error("❌ Error loading about page:", err);
    res.status(500).send("Server Error");
  }
});


app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      console.log("❌ Email already exists:", normalizedEmail);
      return res.render("auth/signup.ejs", { error: "Email already in use." });
    }
    
    // Create and save user
    const user = new User({ email: normalizedEmail, password });
    await user.save();
    
    console.log("✅ New user saved:", user.email);
    res.redirect("/login");
  } catch (err) {
    console.error("❌ Signup Error:", err);
    
    // Handle duplicate key error specifically
    if (err.code === 11000) {
      return res.render("auth/signup.ejs", { error: "Email already in use." });
    }
    
    res.render("auth/signup.ejs", { error: "Something went wrong. Try again." });
  }
});
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log("🔍 Login attempt for:", email);
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      console.log("❌ User not found:", email);
      return res.render("auth/login.ejs", { error: "Invalid email or password." });
    }
    
    console.log("👤 User found:", user.email);
    
    // Check password
    const isMatch = await user.isValidPassword(password);
    console.log("🔑 Password match:", isMatch);
    
    if (!isMatch) {
      return res.render("auth/login.ejs", { error: "Invalid email or password." });
    }
    
    console.log("✅ User logged in:", user.email);
    res.redirect("/listings");
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.render("auth/login.ejs", { error: "Something went wrong. Try again." });
  }
});
