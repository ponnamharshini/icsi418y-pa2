
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

async function startServer() {
    try {
        await client.connect();
        console.log("Connected to MongoDB!");

        const db = client.db("pa2");

        // Reuse the existing PA2 users collection.
        const users = db.collection("users");
        const projects = db.collection("Projects");
        const memberships = db.collection("ProjectMemberships");

        // Database indexes
        await users.createIndex({ username: 1 }, { unique: true });
        await memberships.createIndex(
            { project_id: 1, user_id: 1 },
            { unique: true }
        );

        app.get("/", (req, res) => {
            res.send("Backend server is running!");
        });

        // -------------------------
        // SIGNUP (PA2)
        // -------------------------
        app.post("/api/signup", async (req, res) => {
            try {
                const { f_name, l_name, username, password } = req.body;

                if (
                    !f_name?.trim() ||
                    !l_name?.trim() ||
                    !username?.trim() ||
                    !password
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "All fields are required."
                    });
                }

                const existingUser = await users.findOne({
                    username: username.trim()
                });

                if (existingUser) {
                    return res.status(409).json({
                        success: false,
                        message: "Username already exists."
                    });
                }

                await users.insertOne({
                    f_name: f_name.trim(),
                    l_name: l_name.trim(),
                    username: username.trim(),
                    password
                });

                res.status(201).json({
                    success: true,
                    message: "User created successfully."
                });
            } catch (error) {
                console.error("Signup error:", error);

                if (error.code === 11000) {
                    return res.status(409).json({
                        success: false,
                        message: "Username already exists."
                    });
                }

                res.status(500).json({
                    success: false,
                    message: "Server or database error."
                });
            }
        });

        // -------------------------
        // LOGIN (PA2)
        // -------------------------
        app.post("/api/login", async (req, res) => {
            try {
                const { username, password } = req.body;

                if (!username?.trim() || !password) {
                    return res.status(400).json({
                        success: false,
                        message: "Username and password are required."
                    });
                }

                const user = await users.findOne({
                    username: username.trim()
                });

                if (!user) {
                    return res.status(401).json({
                        success: false,
                        message: "Username does not exist."
                    });
                }

                if (user.password !== password) {
                    return res.status(401).json({
                        success: false,
                        message: "Incorrect password."
                    });
                }

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

        // -------------------------
        // GET REGISTERED USERS
        // -------------------------
        app.get("/api/users", async (req, res) => {
            try {
                const allUsers = await users.find(
                    {},
                    {
                        projection: {
                            f_name: 1,
                            l_name: 1,
                            username: 1
                        }
                    }
                ).sort({ username: 1 }).toArray();

                res.json({
                    success: true,
                    users: allUsers.map(user => ({
                        _id: user._id,
                        f_name: user.f_name,
                        l_name: user.l_name,
                        username: user.username
                    }))
                });
            } catch (error) {
                console.error("Get users error:", error);

                res.status(500).json({
                    success: false,
                    message: "Could not retrieve users."
                });
            }
        });

        // -------------------------
        // CREATE PROJECT
        // -------------------------
        app.post("/api/projects", async (req, res) => {
            let createdProjectId;

            try {
                const { name, description, status, project_lead_id } = req.body;

                if (
                    typeof name !== "string" || !name.trim() ||
                    typeof description !== "string" || !description.trim() ||
                    !status ||
                    !project_lead_id
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "All project fields are required."
                    });
                }

                if (!["Planning", "Active", "Completed"].includes(status)) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid project status."
                    });
                }

                if (!ObjectId.isValid(project_lead_id)) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid Project Lead ID."
                    });
                }

                const leadId = new ObjectId(project_lead_id);
                const lead = await users.findOne({ _id: leadId });

                if (!lead) {
                    return res.status(404).json({
                        success: false,
                        message: "Selected Project Lead does not exist."
                    });
                }

                const result = await projects.insertOne({
                    name: name.trim(),
                    description: description.trim(),
                    status,
                    project_lead_id: leadId
                });

                createdProjectId = result.insertedId;

                // The Project Lead must also be a project member.
                await memberships.insertOne({
                    project_id: createdProjectId,
                    user_id: leadId
                });

                res.status(201).json({
                    success: true,
                    message: "Project created successfully.",
                    project_id: createdProjectId
                });
            } catch (error) {
                console.error("Create project error:", error);

                // Avoid leaving a project without its required lead membership.
                if (createdProjectId) {
                    try {
                        await memberships.deleteOne({
                            project_id: createdProjectId
                        });
                        await projects.deleteOne({
                            _id: createdProjectId
                        });
                    } catch (cleanupError) {
                        console.error("Project cleanup error:", cleanupError);
                    }
                }

                res.status(500).json({
                    success: false,
                    message: "Could not create project due to a server or database error."
                });
            }
        });

        // -------------------------
        // VIEW ALL PROJECTS
        // -------------------------
        app.get("/api/projects", async (req, res) => {
            try {
                const allProjects = await projects.aggregate([
                    {
                        $lookup: {
                            from: "users",
                            localField: "project_lead_id",
                            foreignField: "_id",
                            as: "lead"
                        }
                    },
                    {
                        $unwind: {
                            path: "$lead",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $project: {
                            name: 1,
                            description: 1,
                            status: 1,
                            project_lead_id: 1,
                            project_lead: {
                                $ifNull: ["$lead.username", "Unknown"]
                            },
                            project_lead_name: {
                                $trim: {
                                    input: {
                                        $concat: [
                                            { $ifNull: ["$lead.f_name", ""] },
                                            " ",
                                            { $ifNull: ["$lead.l_name", ""] }
                                        ]
                                    }
                                }
                            }
                        }
                    },
                    { $sort: { name: 1 } }
                ]).toArray();

                res.json({
                    success: true,
                    projects: allProjects
                });
            } catch (error) {
                console.error("Get projects error:", error);

                res.status(500).json({
                    success: false,
                    message: "Could not retrieve projects."
                });
            }
        });

        // -------------------------
        // VIEW MEMBERS OF A PROJECT
        // -------------------------
        app.get("/api/projects/:id/members", async (req, res) => {
            try {
                const { id } = req.params;

                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid project ID."
                    });
                }

                const projectId = new ObjectId(id);
                const project = await projects.findOne({ _id: projectId });

                if (!project) {
                    return res.status(404).json({
                        success: false,
                        message: "Project does not exist."
                    });
                }

                const projectMembers = await memberships.aggregate([
                    { $match: { project_id: projectId } },
                    {
                        $lookup: {
                            from: "users",
                            localField: "user_id",
                            foreignField: "_id",
                            as: "user"
                        }
                    },
                    { $unwind: "$user" },
                    {
                        $project: {
                            _id: 1,
                            project_id: 1,
                            user_id: 1,
                            f_name: "$user.f_name",
                            l_name: "$user.l_name",
                            username: "$user.username",
                            is_project_lead: {
                                $eq: ["$user_id", project.project_lead_id]
                            }
                        }
                    },
                    { $sort: { username: 1 } }
                ]).toArray();

                res.json({
                    success: true,
                    members: projectMembers
                });
            } catch (error) {
                console.error("Get members error:", error);

                res.status(500).json({
                    success: false,
                    message: "Could not retrieve project members."
                });
            }
        });

        // -------------------------
        // ADD A MEMBER TO A PROJECT
        // -------------------------
        app.post("/api/projects/:id/members", async (req, res) => {
            try {
                const { id } = req.params;
                const { user_id } = req.body;

                if (!ObjectId.isValid(id) || !ObjectId.isValid(user_id || "")) {
                    return res.status(400).json({
                        success: false,
                        message: "Valid project ID and user ID are required."
                    });
                }

                const projectId = new ObjectId(id);
                const userId = new ObjectId(user_id);

                const project = await projects.findOne({ _id: projectId });

                if (!project) {
                    return res.status(404).json({
                        success: false,
                        message: "Project does not exist."
                    });
                }

                const user = await users.findOne({ _id: userId });

                if (!user) {
                    return res.status(404).json({
                        success: false,
                        message: "User does not exist."
                    });
                }

                const existingMembership = await memberships.findOne({
                    project_id: projectId,
                    user_id: userId
                });

                if (existingMembership) {
                    return res.status(409).json({
                        success: false,
                        message: "User is already a member of this project."
                    });
                }

                await memberships.insertOne({
                    project_id: projectId,
                    user_id: userId
                });

                res.status(201).json({
                    success: true,
                    message: "Member added successfully."
                });
            } catch (error) {
                console.error("Add member error:", error);

                if (error.code === 11000) {
                    return res.status(409).json({
                        success: false,
                        message: "User is already a member of this project."
                    });
                }

                res.status(500).json({
                    success: false,
                    message: "Could not add member due to a server or database error."
                });
            }
        });

        // -------------------------
        // REMOVE A NON-LEAD MEMBER
        // -------------------------
        app.delete(
            "/api/projects/:id/members/:userId",
            async (req, res) => {
                try {
                    const { id, userId } = req.params;

                    if (
                        !ObjectId.isValid(id) ||
                        !ObjectId.isValid(userId)
                    ) {
                        return res.status(400).json({
                            success: false,
                            message: "Invalid project ID or user ID."
                        });
                    }

                    const projectId = new ObjectId(id);
                    const memberId = new ObjectId(userId);

                    const project = await projects.findOne({
                        _id: projectId
                    });

                    if (!project) {
                        return res.status(404).json({
                            success: false,
                            message: "Project does not exist."
                        });
                    }

                    const user = await users.findOne({ _id: memberId });

                    if (!user) {
                        return res.status(404).json({
                            success: false,
                            message: "User does not exist."
                        });
                    }

                    if (project.project_lead_id.equals(memberId)) {
                        return res.status(400).json({
                            success: false,
                            message: "The Project Lead cannot be removed."
                        });
                    }

                    const result = await memberships.deleteOne({
                        project_id: projectId,
                        user_id: memberId
                    });

                    if (result.deletedCount === 0) {
                        return res.status(404).json({
                            success: false,
                            message: "User is not a member of this project."
                        });
                    }

                    res.json({
                        success: true,
                        message: "Member removed successfully."
                    });
                } catch (error) {
                    console.error("Remove member error:", error);

                    res.status(500).json({
                        success: false,
                        message: "Could not remove member due to a server or database error."
                    });
                }
            }
        );

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
}

startServer();
