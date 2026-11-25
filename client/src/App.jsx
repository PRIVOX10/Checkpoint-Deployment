import { useEffect, useState } from "react";

// Base URL of the API. Relative, so it works both locally and on Azure
// (the React build is served by the same Express server as the API).
const API_URL = "/users";

// Empty form values, used to reset the form
const emptyForm = { name: "", email: "", age: "" };

function App() {
  const [users, setUsers] = useState([]); // list of users from the database
  const [form, setForm] = useState(emptyForm); // values typed in the form
  const [editingId, setEditingId] = useState(null); // id of the user being edited (null = adding)
  const [error, setError] = useState(""); // error message to display
  const [loading, setLoading] = useState(true);

  // GET: load all users from the API
  const fetchUsers = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Could not load users");
      setUsers(await res.json());
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load the users once, when the page opens
  useEffect(() => {
    fetchUsers();
  }, []);

  // Update the form state when the user types in an input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // POST (add) or PUT (edit), depending on editingId
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Send age as a number, or leave it out if empty
    const body = { name: form.name, email: form.email };
    if (form.age !== "") body.age = Number(form.age);

    const res = await fetch(editingId ? `${API_URL}/${editingId}` : API_URL, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    // Show the server's validation message (missing field, duplicate email...)
    if (!res.ok) {
      setError(data.error || data.message);
      return;
    }

    // Success: reset the form and reload the list
    setForm(emptyForm);
    setEditingId(null);
    fetchUsers();
  };

  // Fill the form with an existing user to edit it
  const handleEdit = (user) => {
    setEditingId(user._id);
    setForm({ name: user.name, email: user.email, age: user.age ?? "" });
    setError("");
  };

  // Leave edit mode without saving
  const handleCancel = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  // DELETE: remove a user by id
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Could not delete user");
      return;
    }
    // If the deleted user was being edited, leave edit mode
    if (id === editingId) handleCancel();
    fetchUsers();
  };

  return (
    <main className="container">
      <h1>Users Manager</h1>
      <p className="subtitle">MERN app: MongoDB · Express · React · Node.js</p>

      {/* Form used for both adding and editing */}
      <form className="card" onSubmit={handleSubmit}>
        <h2>{editingId ? "Edit user" : "Add a user"}</h2>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input name="age" type="number" min="0" placeholder="Age (optional)" value={form.age} onChange={handleChange} />
        <div className="actions">
          <button type="submit">{editingId ? "Save" : "Add"}</button>
          {editingId && (
            <button type="button" className="secondary" onClick={handleCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      {/* List of users */}
      <section className="card">
        <h2>Users ({users.length})</h2>
        {loading ? (
          <p>Loading…</p>
        ) : users.length === 0 ? (
          <p className="muted">No users yet. Add one above.</p>
        ) : (
          <ul className="users">
            {users.map((user) => (
              <li key={user._id}>
                <div>
                  <strong>{user.name}</strong>
                  <span className="muted">
                    {user.email}
                    {user.age !== undefined && ` · ${user.age} years`}
                  </span>
                </div>
                <div className="actions">
                  <button className="secondary" onClick={() => handleEdit(user)}>
                    Edit
                  </button>
                  <button className="danger" onClick={() => handleDelete(user._id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;
