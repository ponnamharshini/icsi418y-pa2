import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api";

const STORY_PRIORITIES = ["High", "Medium", "Low"];
const STORY_STATUSES = ["To Do", "In Progress", "Done"];

function App() {
    // Signup
    const [f_name, setFName] = useState("");
    const [l_name, setLName] = useState("");
    const [signupUsername, setSignupUsername] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [signupMessage, setSignupMessage] = useState("");

    // Login
    const [loginUsername, setLoginUsername] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginMessage, setLoginMessage] = useState("");
    const [showLogin, setShowLogin] = useState(false);

    // Navigation and notifications
    const [page, setPage] = useState("auth");
    const [notice, setNotice] = useState("");
    const [noticeType, setNoticeType] = useState("success");
    const [loading, setLoading] = useState(false);

    // Application data
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [members, setMembers] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [selectedUserId, setSelectedUserId] = useState("");

    // Create project form
    const [projectName, setProjectName] = useState("");
    const [projectDescription, setProjectDescription] = useState("");
    const [projectStatus, setProjectStatus] = useState("Planning");
    const [projectLeadId, setProjectLeadId] = useState("");

    // PA4 User Stories
    const [stories, setStories] = useState([]);
    const [storyTitle, setStoryTitle] = useState("");
    const [storyDescription, setStoryDescription] = useState("");
    const [storyPriority, setStoryPriority] = useState("Medium");
    const [storyStatus, setStoryStatus] = useState("To Do");
    const [storyAssignedUserId, setStoryAssignedUserId] = useState("");
    const [editingStoryId, setEditingStoryId] = useState("");

    function showNotice(message, type = "success") {
        setNotice(message);
        setNoticeType(type);
    }

    async function request(path, options = {}) {
        const response = await fetch(`${API}${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options.headers
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "The request failed.");
        }

        return data;
    }

    // -------------------------
    // SIGNUP (PA2)
    // -------------------------
    async function handleSignup(e) {
        e.preventDefault();

        if (
            !f_name.trim() ||
            !l_name.trim() ||
            !signupUsername.trim() ||
            !signupPassword
        ) {
            setSignupMessage("All fields are required.");
            return;
        }

        setSignupMessage("Creating account...");

        try {
            const data = await request("/signup", {
                method: "POST",
                body: JSON.stringify({
                    f_name,
                    l_name,
                    username: signupUsername,
                    password: signupPassword
                })
            });

            setSignupMessage(data.message);
            setFName("");
            setLName("");
            setSignupUsername("");
            setSignupPassword("");
        } catch (error) {
            setSignupMessage(error.message);
        }
    }

    // -------------------------
    // LOGIN (PA2)
    // -------------------------
    async function handleLogin(e) {
        e.preventDefault();

        if (!loginUsername.trim() || !loginPassword) {
            setLoginMessage("Username and password are required.");
            return;
        }

        setLoginMessage("Logging in...");

        try {
            const data = await request("/login", {
                method: "POST",
                body: JSON.stringify({
                    username: loginUsername,
                    password: loginPassword
                })
            });

            setLoginMessage(data.message);
            setLoginPassword("");
            setPage("projects");
            showNotice(`Welcome, ${loginUsername}!`);
        } catch (error) {
            setLoginMessage(error.message);
        }
    }

    // -------------------------
    // LOAD USERS
    // -------------------------
    async function loadUsers() {
        const data = await request("/users");
        setUsers(data.users || []);
    }

    // -------------------------
    // LOAD PROJECTS
    // -------------------------
    async function loadProjects() {
        const data = await request("/projects");
        const projectList = data.projects || [];

        setProjects(projectList);

        if (
            selectedProjectId &&
            !projectList.some(
                (project) => project._id === selectedProjectId
            )
        ) {
            setSelectedProjectId("");
            setMembers([]);
            setStories([]);
            resetStoryForm();
        }
    }

    // -------------------------
    // LOAD PROJECT MEMBERS
    // -------------------------
    async function loadMembers(projectId) {
        if (!projectId) {
            setMembers([]);
            return;
        }

        const data = await request(`/projects/${projectId}/members`);
        setMembers(data.members || []);
    }

    // -------------------------
    // LOAD USERS AND PROJECTS
    // -------------------------
    useEffect(() => {
        if (page === "auth") return;

        let cancelled = false;

        async function loadInitialData() {
            setLoading(true);

            try {
                const [userData, projectData] = await Promise.all([
                    request("/users"),
                    request("/projects")
                ]);

                if (cancelled) return;

                setUsers(userData.users || []);
                setProjects(projectData.projects || []);
            } catch (error) {
                if (!cancelled) {
                    showNotice(error.message, "error");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadInitialData();

        return () => {
            cancelled = true;
        };
    }, [page]);

    // -------------------------
    // REFRESH MEMBERS
    // -------------------------
    useEffect(() => {
        if (
            !selectedProjectId ||
            (page !== "members" && page !== "backlog")
        ) {
            setMembers([]);
            return;
        }

        let cancelled = false;

        async function fetchMembers() {
            try {
                const data = await request(
                    `/projects/${selectedProjectId}/members`
                );

                if (!cancelled) {
                    setMembers(data.members || []);
                }
            } catch (error) {
                if (!cancelled) {
                    showNotice(error.message, "error");
                }
            }
        }

        fetchMembers();

        return () => {
            cancelled = true;
        };
    }, [selectedProjectId, page]);

    // -------------------------
    // CREATE PROJECT (PA3)
    // -------------------------
    async function handleCreateProject(e) {
        e.preventDefault();

        if (
            !projectName.trim() ||
            !projectDescription.trim() ||
            !projectStatus ||
            !projectLeadId
        ) {
            showNotice("Please complete all project fields.", "error");
            return;
        }

        setLoading(true);

        try {
            const data = await request("/projects", {
                method: "POST",
                body: JSON.stringify({
                    name: projectName,
                    description: projectDescription,
                    status: projectStatus,
                    project_lead_id: projectLeadId
                })
            });

            setProjectName("");
            setProjectDescription("");
            setProjectStatus("Planning");
            setProjectLeadId("");

            await loadProjects();

            showNotice(data.message);
            setPage("projects");
        } catch (error) {
            showNotice(error.message, "error");
        } finally {
            setLoading(false);
        }
    }

    // -------------------------
    // ADD MEMBER (PA3)
    // -------------------------
    async function handleAddMember(e) {
        e.preventDefault();

        if (!selectedProjectId || !selectedUserId) {
            showNotice("Select a project and a user.", "error");
            return;
        }

        setLoading(true);

        try {
            const data = await request(
                `/projects/${selectedProjectId}/members`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        user_id: selectedUserId
                    })
                }
            );

            setSelectedUserId("");
            await loadMembers(selectedProjectId);
            showNotice(data.message);
        } catch (error) {
            showNotice(error.message, "error");
        } finally {
            setLoading(false);
        }
    }

    // -------------------------
    // REMOVE MEMBER (PA3 + PA4)
    // -------------------------
    async function handleRemoveMember(userId) {
        if (!selectedProjectId) return;

        const confirmed = window.confirm(
            "Are you sure you want to remove this member?"
        );

        if (!confirmed) return;

        setLoading(true);

        try {
            const data = await request(
                `/projects/${selectedProjectId}/members/${userId}`,
                { method: "DELETE" }
            );

            await loadMembers(selectedProjectId);
            showNotice(data.message);
        } catch (error) {
            showNotice(error.message, "error");
        } finally {
            setLoading(false);
        }
    }
        // -------------------------
    // RESET USER STORY FORM
    // -------------------------
    function resetStoryForm() {
        setStoryTitle("");
        setStoryDescription("");
        setStoryPriority("Medium");
        setStoryStatus("To Do");
        setStoryAssignedUserId("");
        setEditingStoryId("");
    }

    // -------------------------
    // LOAD PROJECT BACKLOG (PA4)
    // -------------------------
    async function loadStories(projectId) {
        if (!projectId) {
            setStories([]);
            return;
        }

        const data = await request(`/projects/${projectId}/stories`);
        setStories(data.stories || []);
    }

    // -------------------------
    // REFRESH BACKLOG WHEN PROJECT CHANGES
    // -------------------------
    useEffect(() => {
        if (page !== "backlog" || !selectedProjectId) {
            setStories([]);
            return;
        }

        let cancelled = false;

        async function fetchBacklog() {
            try {
                const [storyData, memberData] = await Promise.all([
                    request(`/projects/${selectedProjectId}/stories`),
                    request(`/projects/${selectedProjectId}/members`)
                ]);

                if (!cancelled) {
                    setStories(storyData.stories || []);
                    setMembers(memberData.members || []);
                }
            } catch (error) {
                if (!cancelled) {
                    showNotice(error.message, "error");
                    setStories([]);
                }
            }
        }

        fetchBacklog();

        return () => {
            cancelled = true;
        };
    }, [selectedProjectId, page]);

    // -------------------------
    // CREATE USER STORY (PA4)
    // -------------------------
    async function handleCreateStory(e) {
        e.preventDefault();

        if (!selectedProjectId) {
            showNotice("Please select a project first.", "error");
            return;
        }

        if (!storyTitle.trim() || !storyDescription.trim()) {
            showNotice("Title and description are required.", "error");
            return;
        }

        if (!STORY_PRIORITIES.includes(storyPriority)) {
            showNotice("Please select a valid priority.", "error");
            return;
        }

        setLoading(true);

        try {
            const data = await request(
                `/projects/${selectedProjectId}/stories`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        title: storyTitle,
                        description: storyDescription,
                        priority: storyPriority,
                        assigned_user_id: storyAssignedUserId || null
                    })
                }
            );

            resetStoryForm();
            await loadStories(selectedProjectId);
            showNotice(data.message);
        } catch (error) {
            showNotice(error.message, "error");
        } finally {
            setLoading(false);
        }
    }

    // -------------------------
    // LOAD STORY INTO EDIT FORM
    // -------------------------
    function handleEditStory(story) {
        setEditingStoryId(story._id);
        setStoryTitle(story.title || "");
        setStoryDescription(story.description || "");
        setStoryPriority(story.priority || "Medium");
        setStoryStatus(story.status || "To Do");
        setStoryAssignedUserId(story.assigned_user_id || "");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    // -------------------------
    // UPDATE USER STORY (PA4)
    // -------------------------
    async function handleUpdateStory(e) {
        e.preventDefault();

        if (!selectedProjectId || !editingStoryId) {
            showNotice("Select a story to edit.", "error");
            return;
        }

        if (!storyTitle.trim() || !storyDescription.trim()) {
            showNotice("Title and description are required.", "error");
            return;
        }

        if (!STORY_PRIORITIES.includes(storyPriority)) {
            showNotice("Please select a valid priority.", "error");
            return;
        }

        if (!STORY_STATUSES.includes(storyStatus)) {
            showNotice("Please select a valid status.", "error");
            return;
        }

        setLoading(true);

        try {
            const data = await request(
                `/projects/${selectedProjectId}/stories/${editingStoryId}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        title: storyTitle,
                        description: storyDescription,
                        priority: storyPriority,
                        status: storyStatus,
                        assigned_user_id: storyAssignedUserId || null
                    })
                }
            );

            resetStoryForm();
            await loadStories(selectedProjectId);
            showNotice(data.message);
        } catch (error) {
            showNotice(error.message, "error");
        } finally {
            setLoading(false);
        }
    }

    // -------------------------
    // DELETE USER STORY (PA4)
    // -------------------------
    async function handleDeleteStory(storyId) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this user story? This action cannot be undone."
        );

        if (!confirmed) return;

        setLoading(true);

        try {
            const data = await request(
                `/projects/${selectedProjectId}/stories/${storyId}`,
                { method: "DELETE" }
            );

            if (editingStoryId === storyId) {
                resetStoryForm();
            }

            await loadStories(selectedProjectId);
            showNotice(data.message);
        } catch (error) {
            showNotice(error.message, "error");
        } finally {
            setLoading(false);
        }
    }

    // -------------------------
    // FORMAT USER NAMES
    // -------------------------
    function displayUser(user) {
        const fullName =
            `${user.f_name || ""} ${user.l_name || ""}`.trim();

        return fullName
            ? `${fullName} (@${user.username})`
            : user.username;
    }

    // Get assigned member name for a story.
    function getAssignedName(story) {
        if (!story.assigned_user_id) {
            return "Unassigned";
        }

        const member = members.find(
            (item) =>
                String(item.user_id) === String(story.assigned_user_id)
        );

        if (member) {
            const fullName =
                `${member.f_name || ""} ${member.l_name || ""}`.trim();

            return fullName
                ? `${fullName} (@${member.username})`
                : member.username;
        }

        return story.assigned_user_name &&
            story.assigned_user_name !== "Unassigned"
            ? story.assigned_user_name
            : story.assigned_username || "Assigned member";
    }
        // -------------------------
    // SIGNUP AND LOGIN SCREEN
    // -------------------------
    if (page === "auth") {
        return (
            <main className="auth-page">
                <section className="auth-card">
                    <p className="eyebrow">ICSI 418Y · PA2 + PA3 + PA4</p>

                    <h1>
                        {showLogin ? "Welcome back" : "Create an account"}
                    </h1>

                    <p className="subtitle">
                        {showLogin
                            ? "Log in to access project management."
                            : "Register to get started."}
                    </p>

                    {showLogin ? (
                        <form onSubmit={handleLogin} className="form">
                            <label>
                                Username
                                <input
                                    value={loginUsername}
                                    onChange={(e) =>
                                        setLoginUsername(e.target.value)
                                    }
                                    required
                                />
                            </label>

                            <label>
                                Password
                                <input
                                    type="password"
                                    value={loginPassword}
                                    onChange={(e) =>
                                        setLoginPassword(e.target.value)
                                    }
                                    required
                                />
                            </label>

                            <button type="submit" className="primary-button">
                                Login
                            </button>

                            <p className="form-message">{loginMessage}</p>

                            <button
                                type="button"
                                className="text-button"
                                onClick={() => {
                                    setShowLogin(false);
                                    setLoginMessage("");
                                }}
                            >
                                Need an account? Sign up
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSignup} className="form">
                            <label>
                                First name
                                <input
                                    value={f_name}
                                    onChange={(e) =>
                                        setFName(e.target.value)
                                    }
                                    required
                                />
                            </label>

                            <label>
                                Last name
                                <input
                                    value={l_name}
                                    onChange={(e) =>
                                        setLName(e.target.value)
                                    }
                                    required
                                />
                            </label>

                            <label>
                                Username
                                <input
                                    value={signupUsername}
                                    onChange={(e) =>
                                        setSignupUsername(e.target.value)
                                    }
                                    required
                                />
                            </label>

                            <label>
                                Password
                                <input
                                    type="password"
                                    value={signupPassword}
                                    onChange={(e) =>
                                        setSignupPassword(e.target.value)
                                    }
                                    required
                                />
                            </label>

                            <button type="submit" className="primary-button">
                                Sign Up
                            </button>

                            <p className="form-message">{signupMessage}</p>

                            <button
                                type="button"
                                className="text-button"
                                onClick={() => {
                                    setShowLogin(true);
                                    setSignupMessage("");
                                }}
                            >
                                Already registered? Log in
                            </button>
                        </form>
                    )}
                </section>
            </main>
        );
    }

    // -------------------------
    // MAIN APPLICATION
    // -------------------------
    return (
        <main className="app-shell">
            <header className="topbar">
                <div>
                    <p className="eyebrow">
                        ICSI 418Y · PROGRAMMING ASSIGNMENT 4
                    </p>
                    <h1>Project Hub</h1>
                </div>

                <button
                    className="secondary-button"
                    onClick={() => {
                        setPage("auth");
                        setShowLogin(true);
                        setNotice("");
                        setStories([]);
                        setMembers([]);
                        resetStoryForm();
                    }}
                >
                    Back to Login
                </button>
            </header>

            {/* NAVIGATION */}
            <nav className="navigation">
                <button
                    className={page === "projects" ? "nav-active" : ""}
                    onClick={() => setPage("projects")}
                >
                    View Projects
                </button>

                <button
                    className={page === "create" ? "nav-active" : ""}
                    onClick={() => setPage("create")}
                >
                    Create Project
                </button>

                <button
                    className={page === "members" ? "nav-active" : ""}
                    onClick={() => setPage("members")}
                >
                    Manage Memberships
                </button>

                <button
                    className={page === "backlog" ? "nav-active" : ""}
                    onClick={() => {
                        resetStoryForm();
                        setPage("backlog");
                    }}
                >
                    Project Backlog
                </button>
            </nav>

            {/* NOTIFICATIONS */}
            {notice && (
                <div
                    className={`notice ${noticeType}`}
                    role="status"
                >
                    {notice}

                    <button
                        className="notice-close"
                        onClick={() => setNotice("")}
                        aria-label="Dismiss message"
                    >
                        ×
                    </button>
                </div>
            )}

            {loading && (
                <p className="loading-text">Processing...</p>
            )}

            {/* -------------------------
                CREATE PROJECT (PA3)
            ------------------------- */}
            {page === "create" && (
                <section className="panel">
                    <h2>Create a project</h2>

                    <p className="subtitle">
                        Add a project and assign a registered user as its lead.
                    </p>

                    <form
                        onSubmit={handleCreateProject}
                        className="form"
                    >
                        <label>
                            Project name
                            <input
                                value={projectName}
                                onChange={(e) =>
                                    setProjectName(e.target.value)
                                }
                                required
                            />
                        </label>

                        <label>
                            Description
                            <textarea
                                value={projectDescription}
                                onChange={(e) =>
                                    setProjectDescription(e.target.value)
                                }
                                rows="4"
                                required
                            />
                        </label>

                        <label>
                            Status
                            <select
                                value={projectStatus}
                                onChange={(e) =>
                                    setProjectStatus(e.target.value)
                                }
                                required
                            >
                                <option value="Planning">Planning</option>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </label>

                        <label>
                            Project Lead
                            <select
                                value={projectLeadId}
                                onChange={(e) =>
                                    setProjectLeadId(e.target.value)
                                }
                                required
                            >
                                <option value="">
                                    Select a registered user
                                </option>

                                {users.map((user) => (
                                    <option
                                        key={user._id}
                                        value={user._id}
                                    >
                                        {displayUser(user)}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {users.length === 0 && (
                            <p className="empty-state">
                                No registered users found. Create a user first.
                            </p>
                        )}

                        <button
                            type="submit"
                            className="primary-button"
                            disabled={loading || users.length === 0}
                        >
                            Create Project
                        </button>
                    </form>
                </section>
            )}

            {/* -------------------------
                VIEW PROJECTS (PA3)
            ------------------------- */}
            {page === "projects" && (
                <section className="panel">
                    <div className="section-heading">
                        <div>
                            <h2>All projects</h2>
                            <p className="subtitle">
                                {projects.length} project
                                {projects.length === 1 ? "" : "s"} found
                            </p>
                        </div>

                        <button
                            className="secondary-button"
                            onClick={async () => {
                                try {
                                    await loadProjects();
                                    showNotice("Project list refreshed.");
                                } catch (error) {
                                    showNotice(error.message, "error");
                                }
                            }}
                        >
                            Refresh
                        </button>
                    </div>

                    {projects.length === 0 ? (
                        <div className="empty-state">
                            <h3>No projects yet</h3>
                            <p>Create your first project to get started.</p>

                            <button
                                className="primary-button"
                                onClick={() => setPage("create")}
                            >
                                Create Project
                            </button>
                        </div>
                    ) : (
                        <div className="project-grid">
                            {projects.map((project) => (
                                <article
                                    className="project-card"
                                    key={project._id}
                                >
                                    <div className="project-card-heading">
                                        <h3>{project.name}</h3>

                                        <span
                                            className={`status-badge ${(
                                                project.status || "Planning"
                                            ).toLowerCase()}`}
                                        >
                                            {project.status}
                                        </span>
                                    </div>

                                    <p className="project-description">
                                        {project.description}
                                    </p>

                                    <div className="project-meta">
                                        <span className="meta-label">
                                            Project Lead
                                        </span>

                                        <strong>
                                            {project.project_lead_name ||
                                                project.project_lead ||
                                                "Unknown"}
                                        </strong>

                                        {project.project_lead_name &&
                                            project.project_lead && (
                                                <span className="muted">
                                                    @{project.project_lead}
                                                </span>
                                            )}
                                    </div>

                                    <button
                                        className="secondary-button full-width"
                                        onClick={() => {
                                            setSelectedProjectId(project._id);
                                            setSelectedUserId("");
                                            setMembers([]);
                                            setStories([]);
                                            resetStoryForm();
                                            setPage("members");
                                        }}
                                    >
                                        Manage Members
                                    </button>

                                    <button
                                        className="primary-button full-width"
                                        onClick={() => {
                                            setSelectedProjectId(project._id);
                                            setMembers([]);
                                            setStories([]);
                                            resetStoryForm();
                                            setPage("backlog");
                                        }}
                                    >
                                        View Project Backlog
                                    </button>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* -------------------------
                MANAGE MEMBERSHIPS (PA3 + PA4)
            ------------------------- */}
            {page === "members" && (
                <section className="panel">
                    <h2>Manage project memberships</h2>

                    <p className="subtitle">
                        Add registered users or remove non-lead members.
                        Members with assigned user stories cannot be removed.
                    </p>

                    <label className="project-selector">
                        Select project

                        <select
                            value={selectedProjectId}
                            onChange={(e) => {
                                setSelectedProjectId(e.target.value);
                                setSelectedUserId("");
                            }}
                        >
                            <option value="">Choose a project</option>

                            {projects.map((project) => (
                                <option
                                    key={project._id}
                                    value={project._id}
                                >
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    {!selectedProjectId ? (
                        <div className="empty-state">
                            Select a project to view its members.

                            {projects.length === 0 && (
                                <p>
                                    Create a project before managing memberships.
                                </p>
                            )}
                        </div>
                    ) : (
                        <>
                            <form
                                onSubmit={handleAddMember}
                                className="add-member-form"
                            >
                                <label>
                                    Add registered user

                                    <select
                                        value={selectedUserId}
                                        onChange={(e) =>
                                            setSelectedUserId(e.target.value)
                                        }
                                        required
                                    >
                                        <option value="">Select a user</option>

                                        {users
                                            .filter(
                                                (user) =>
                                                    !members.some(
                                                        (member) =>
                                                            String(member.user_id) ===
                                                            String(user._id)
                                                    )
                                            )
                                            .map((user) => (
                                                <option
                                                    key={user._id}
                                                    value={user._id}
                                                >
                                                    {displayUser(user)}
                                                </option>
                                            ))}
                                    </select>
                                </label>

                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={loading || !selectedUserId}
                                >
                                    Add Member
                                </button>
                            </form>

                            <div className="section-heading members-heading">
                                <h3>Current members ({members.length})</h3>

                                <button
                                    className="secondary-button"
                                    onClick={async () => {
                                        try {
                                            await loadMembers(selectedProjectId);
                                            showNotice("Membership list refreshed.");
                                        } catch (error) {
                                            showNotice(error.message, "error");
                                        }
                                    }}
                                >
                                    Refresh
                                </button>
                            </div>

                            {members.length === 0 ? (
                                <p className="empty-state">
                                    No members found for this project.
                                </p>
                            ) : (
                                <div className="member-list">
                                    {members.map((member) => (
                                        <div
                                            className="member-row"
                                            key={member._id}
                                        >
                                            <div className="member-avatar">
                                                {(
                                                    member.f_name ||
                                                    member.username ||
                                                    "?"
                                                )
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <div className="member-info">
                                                <strong>
                                                    {`${member.f_name || ""} ${
                                                        member.l_name || ""
                                                    }`.trim() || member.username}
                                                </strong>

                                                <span>@{member.username}</span>
                                            </div>

                                            {member.is_project_lead ? (
                                                <span className="lead-badge">
                                                    Project Lead
                                                </span>
                                            ) : (
                                                <button
                                                    className="danger-button"
                                                    onClick={() =>
                                                        handleRemoveMember(
                                                            member.user_id
                                                        )
                                                    }
                                                    disabled={loading}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </section>
            )}

            {/* -------------------------
                PROJECT BACKLOG (PA4)
            ------------------------- */}
            {page === "backlog" && (
                <section className="panel">
                    <h2>Project Backlog</h2>

                    <p className="subtitle">
                        Create, view, edit, assign, and manage user stories.
                    </p>

                    <label className="project-selector">
                        Select project

                        <select
                            value={selectedProjectId}
                            onChange={(e) => {
                                setSelectedProjectId(e.target.value);
                                setStories([]);
                                setMembers([]);
                                resetStoryForm();
                            }}
                        >
                            <option value="">Choose a project</option>

                            {projects.map((project) => (
                                <option
                                    key={project._id}
                                    value={project._id}
                                >
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    {!selectedProjectId ? (
                        <div className="empty-state">
                            Select a project to view its backlog.
                        </div>
                    ) : (
                        <>
                            {/* CREATE OR EDIT STORY FORM */}
                            <div className="story-form-section">
                                <h3>
                                    {editingStoryId
                                        ? "Edit User Story"
                                        : "Create User Story"}
                                </h3>

                                <form
                                    onSubmit={
                                        editingStoryId
                                            ? handleUpdateStory
                                            : handleCreateStory
                                    }
                                    className="form"
                                >
                                    <label>
                                        Story Title

                                        <input
                                            value={storyTitle}
                                            onChange={(e) =>
                                                setStoryTitle(e.target.value)
                                            }
                                            placeholder="Enter a short story title"
                                            required
                                        />
                                    </label>

                                    <label>
                                        Description

                                        <textarea
                                            value={storyDescription}
                                            onChange={(e) =>
                                                setStoryDescription(e.target.value)
                                            }
                                            rows="4"
                                            placeholder="As a [type of user], I want [goal], so that [benefit]."
                                            required
                                        />
                                    </label>

                                    <label>
                                        Priority

                                        <select
                                            value={storyPriority}
                                            onChange={(e) =>
                                                setStoryPriority(e.target.value)
                                            }
                                            required
                                        >
                                            {STORY_PRIORITIES.map((priority) => (
                                                <option
                                                    key={priority}
                                                    value={priority}
                                                >
                                                    {priority}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    {editingStoryId && (
                                        <label>
                                            Status

                                            <select
                                                value={storyStatus}
                                                onChange={(e) =>
                                                    setStoryStatus(e.target.value)
                                                }
                                                required
                                            >
                                                {STORY_STATUSES.map((status) => (
                                                    <option
                                                        key={status}
                                                        value={status}
                                                    >
                                                        {status}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    )}

                                    <label>
                                        Assigned Member

                                        <select
                                            value={storyAssignedUserId}
                                            onChange={(e) =>
                                                setStoryAssignedUserId(e.target.value)
                                            }
                                        >
                                            <option value="">Unassigned</option>

                                            {members.map((member) => (
                                                <option
                                                    key={member.user_id}
                                                    value={member.user_id}
                                                >
                                                    {displayUser(member)}
                                                    {member.is_project_lead
                                                        ? " (Project Lead)"
                                                        : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <div className="story-form-actions">
                                        <button
                                            type="submit"
                                            className="primary-button"
                                            disabled={loading}
                                        >
                                            {editingStoryId
                                                ? "Save Changes"
                                                : "Create User Story"}
                                        </button>

                                        {editingStoryId && (
                                            <button
                                                type="button"
                                                className="secondary-button"
                                                onClick={resetStoryForm}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* BACKLOG LIST */}
                            <div className="section-heading">
                                <div>
                                    <h3>User Stories ({stories.length})</h3>
                                    <p className="subtitle">
                                        All stories for the selected project.
                                    </p>
                                </div>

                                <button
                                    className="secondary-button"
                                    onClick={async () => {
                                        try {
                                            await loadStories(selectedProjectId);
                                            showNotice("Backlog refreshed.");
                                        } catch (error) {
                                            showNotice(error.message, "error");
                                        }
                                    }}
                                >
                                    Refresh
                                </button>
                            </div>

                            {stories.length === 0 ? (
                                <div className="empty-state">
                                    <h3>No user stories yet</h3>
                                    <p>
                                        Create a user story to get started.
                                    </p>
                                </div>
                            ) : (
                                <div className="story-list">
                                    {stories.map((story) => (
                                        <article
                                            className="story-card"
                                            key={story._id}
                                        >
                                            <div className="story-card-heading">
                                                <h3>{story.title}</h3>

                                                <span
                                                    className={`priority-badge ${
                                                        story.priority.toLowerCase()
                                                    }`}
                                                >
                                                    {story.priority} Priority
                                                </span>
                                            </div>

                                            <p className="story-description">
                                                {story.description}
                                            </p>

                                            <div className="story-meta">
                                                <span>
                                                    <strong>Status:</strong>{" "}
                                                    <span
                                                        className={`story-status ${
                                                            story.status
                                                                .toLowerCase()
                                                                .replace(" ", "-")
                                                        }`}
                                                    >
                                                        {story.status}
                                                    </span>
                                                </span>

                                                <span>
                                                    <strong>Assigned to:</strong>{" "}
                                                    {getAssignedName(story)}
                                                </span>
                                            </div>

                                            <div className="story-actions">
                                                <button
                                                    className="secondary-button"
                                                    onClick={() =>
                                                        handleEditStory(story)
                                                    }
                                                    disabled={loading}
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    className="danger-button"
                                                    onClick={() =>
                                                        handleDeleteStory(story._id)
                                                    }
                                                    disabled={loading}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </section>
            )}

            <footer className="app-footer">
                ICSI 418Y · Projects, Memberships and User Stories
            </footer>
        </main>
    );
}

export default App;