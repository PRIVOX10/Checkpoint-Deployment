// Import path to build file paths that work on Windows and Linux (Azure)
const path = require("path");

// Load environment variables from config/.env into process.env.
// On Azure there is no .env file: the variables come from the App Service
// "Environment variables" settings instead, and dotenv simply finds nothing.
require("dotenv").config({ path: path.join(__dirname, "config", ".env") });

// Optional: use custom DNS servers (e.g. DNS_SERVERS=8.8.8.8,1.1.1.1).
// Some local networks can't resolve the "mongodb+srv://" address of Atlas
// (error "querySrv ECONNREFUSED"). Not needed on Azure, so leave it unset there.
if (process.env.DNS_SERVERS) {
  require("dns").setServers(process.env.DNS_SERVERS.split(","));
}

// Import dependencies
const express = require("express");
const mongoose = require("mongoose");

// Import the User model (mongoose schema defined in models/User.js)
const User = require("./models/User");

// Create the Express application
const app = express();

// Middleware to parse JSON request bodies (needed for POST and PUT)
app.use(express.json());

// Serve the React production build (client/ is built into public/)
// Visiting "/" returns public/index.html, which loads the React app
app.use(express.static(path.join(__dirname, "public")));

// Read the port and database URI from the environment variables
// (Azure sets PORT automatically, MONGO_URI is set in the Azure settings)
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Stop early with a clear message if the database URI is missing
if (!MONGO_URI) {
  console.error("MONGO_URI is not defined. Set it in config/.env or in the Azure settings.");
  process.exit(1);
}

/* ---------------------------------------------------------------
   ROUTES
---------------------------------------------------------------- */

// GET /users : return all users
app.get("/users", async (req, res) => {
  try {
    // find() with no filter returns every document in the collection
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
});

// POST /users : add a new user to the database
app.post("/users", async (req, res) => {
  try {
    // Build a new document from the request body, then save it
    const newUser = new User(req.body);
    const savedUser = await newUser.save();
    // 201 = resource created
    res.status(201).json(savedUser);
  } catch (error) {
    // 400 = invalid data (missing field, duplicate email, ...)
    res.status(400).json({ message: "Error creating user", error: error.message });
  }
});

// PUT /users/:id : edit a user by id
app.put("/users/:id", async (req, res) => {
  try {
    // req.params.id holds the id from the URL
    // new: true -> return the updated document instead of the old one
    // runValidators: true -> apply the schema rules to the new values
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // If no user has this id, answer 404
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: "Error updating user", error: error.message });
  }
});

// DELETE /users/:id : remove a user by id
app.delete("/users/:id", async (req, res) => {
  try {
    // findByIdAndDelete removes the document and returns it
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    // If no user has this id, answer 404
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully", user: deletedUser });
  } catch (error) {
    res.status(400).json({ message: "Error deleting user", error: error.message });
  }
});

/* ---------------------------------------------------------------
   DATABASE CONNECTION + SERVER START
---------------------------------------------------------------- */

// Connect to MongoDB first, then start the server once connected
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
    process.exit(1); // Stop the app if the database is unreachable
  });
