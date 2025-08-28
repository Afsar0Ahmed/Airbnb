const mongoose = require("mongoose");
const Listing = require("./models/listing"); // Adjust the path if needed
const { data: sampleListings } = require("./data"); // your data.js file

const MONGO_URL =
  process.env.MONGO_URL || "mongodb+srv://sk4885426:OFJpU4oqr0T4KTKK@cluster0.xm7kd4e.mongodb.net/wanderlust";

async function seedDB() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URL);
    console.log("✅ Connected to MongoDB");

    // Optional: clear existing listings
    await Listing.deleteMany({});
    console.log("🗑️ Cleared existing listings");

    // Insert all listings from data.js
    await Listing.insertMany(sampleListings);
    console.log("🌟 Seeded listings to MongoDB");

    // Close the connection
    await mongoose.connection.close();
    console.log("✅ Connection closed");
  } catch (err) {
    console.error("❌ Error seeding DB:", err);
  }
}

// Run the seed script
seedDB();
