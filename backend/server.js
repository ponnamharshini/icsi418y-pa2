const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const client = new MongoClient(process.env.MONGODB_URI);

async function startServer() {
    try {
        await client.connect();
        console.log("Connected to MongoDB!");

        // Select database
        const db = client.db("pa2");

        // Users collection
        const users = db.collection("users");

        // Make usernames unique
        await users.createIndex({ username: 1 }, { unique: true });

        // Test route
        app.get("/", (req, res) => {
            res.send("Backend server is running!");
        });

        // SIGNUP
        app.post("/api/signup", async (req, res) => {
            try {
                const { f_name, l_name, username, password } = req.body;

                // Check required fields
                if (!f_name || !l_name || !username || !password) {
                    return res.status(400).json({
                        success: false,
                        message: "All fields are required."
                    });
                }

                // Check whether username already exists
                const existingUser = await users.findOne({ username });

                if (existingUser) {
                    return res.status(409).json({
                        success: false,
                        message: "Username already exists."
                    });
                }

                // Create new user
                const newUser = {
                    f_name,
                    l_name,
                    username,
                    password
                };

                await users.insertOne(newUser);

                res.status(201).json({
                    success: true,
                    message: "User created successfully."
                });

            } catch (error) {
                console.error("Signup error:", error);

                res.status(500).json({
                    success: false,
                    message: "Server or database error."
                });
            }
        });

        // LOGIN
        app.post("/api/login", async (req, res) => {
            try {
                const { username, password } = req.body;

                // Check required fields
                if (!username || !password) {
                    return res.status(400).json({
                        success: false,
                        message: "Username and password are required."
                    });
                }

                // Find user
                const user = await users.findOne({ username });

                if (!user) {
                    return res.status(401).json({
                        success: false,
                        message: "Username does not exist."
                    });
                }

                // Compare passwords
                if (user.password !== password) {
                    return res.status(401).json({
                        success: false,
                        message: "Incorrect password."
                    });
                }

                // Successful login
                res.status(200).json({
                    success: true,
                    message: "Login successful."
                });

            } catch (error) {
                console.error("Login error:", error);

                res.status(500).json({
                    success: false,
                    message: "Server or database error."
                });
            }
        });

        // Start server
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("MongoDB connection failed:", error);
    }
}

startServer();