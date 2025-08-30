const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const bcrypt = require("bcryptjs");

const Listing = require("./models/listing");
const Review = require("./models/review");
const User = require("./models/User");

const app = express();

// ======================
// MongoDB Connection
// ======================
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("✅ Connected to MongoDB");

    const PORT = process.env.PORT || 8080;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

main();

// ======================
// Middleware & Views
// ======================
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// ======================
// Routes
// ======================

// Health Check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Home
app.get("/", async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
});

// Listings
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

// Show Listing
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
  await Listing.findByIdAndDelete(id);
  res.redirect("/listings");
});

// Add Review
app.post("/listings/:id/review", async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).send("Listing not found");

  const newReview = new Review(req.body.review);
  listing.reviews.push(newReview);

  await newReview.save();
  await listing.save();

  res.redirect(`/listings/${listing._id}`);
});

// About
app.get("/about", async (req, res) => {
  res.render("listings/about.ejs");
});

// ======================
// AUTH ROUTES
// ======================

// GET Signup Page
app.get("/signup", (req, res) => {
  res.render("auth/signup.ejs");
});

// POST Signup
app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.render("auth/signup.ejs", { error: "Email already in use." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({ email: normalizedEmail, password: hashedPassword });
    await user.save();

    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.render("auth/signup.ejs", { error: "Something went wrong. Try again." });
  }
});

// GET Login Page
app.get("/login", (req, res) => {
  res.render("auth/login.ejs");
});

// POST Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.render("auth/login.ejs", { error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("auth/login.ejs", { error: "Invalid email or password." });
    }

    // TODO: Add session or JWT for logged-in state
    res.redirect("/listings");
  } catch (err) {
    console.error(err);
    res.render("auth/login.ejs", { error: "Something went wrong. Try again." });
  }
});
