// Import mongoose to define the schema and create the model
const mongoose = require("mongoose");

// Define the structure of a User document in the "users" collection
const userSchema = new mongoose.Schema(
  {
    // User's full name (required)
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    // User's email (required and unique: two users cannot share an email)
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    // User's age (optional, must be positive)
    age: {
      type: Number,
      min: [0, "Age must be a positive number"],
    },
  },
  {
    // Automatically add createdAt and updatedAt fields
    timestamps: true,
  }
);

// Create the "User" model from the schema and export it so server.js can use it
module.exports = mongoose.model("User", userSchema);
