const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const User = require("./models/User"); // ✅ clean import

const app = express();

// ======================
// MongoDB Connection
// ======================
const MONGO_URL =
  process.env.MONGO_URL || "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
  try {
    await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Start server only after DB is connected
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
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
app.get("/about", (req, res) => {
  res.render("listings/about");
});

// ── Sign-Up ─────────────────────────────────────────
app.get("/signup", (req, res) => {
  res.render("auth/signup.ejs");
});

app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = new User({ email, password });
    await user.save();
    console.log("✅ New user saved:", user.email);
    res.redirect("/login");
  } catch (err) {
    console.error("❌ Signup Error:", err);
    res.render("auth/signup.ejs", { error: "Email already in use." });
  }
});

// ── Log-In ─────────────────────────────────────────
app.get("/login", (req, res) => {
  res.render("auth/login.ejs");
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.isValidPassword(password))) {
      console.log("⚠️ Invalid login attempt:", email);
      return res.render("auth/login.ejs", { error: "Invalid credentials." });
    }

    console.log("✅ User logged in:", user.email);
    res.redirect("/listings");
  } catch (err) {
    console.error("❌ Login error:", err);
    res.render("auth/login.ejs", { error: "Something went wrong." });
  }
});
