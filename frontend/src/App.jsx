
import { useEffect, useState } from "react";
import axios from "axios";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  CalendarDays,
  LayoutDashboard,
  PlusCircle,
  Users,
  Clock,
  MapPin,
  Pencil,
  Trash2,
  Search,
  X,
} from "lucide-react";
import "./App.css";

const API = "http://localhost:5001/api/events";

function Dashboard() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function loadEvents() {
    try {
      const response = await axios.get(API);
      setEvents(response.data);
      setError("");
    } catch {
      setError("Unable to load events. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function deleteEvent(id) {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await axios.delete(`${API}/${id}`);
      await loadEvents();
    } catch {
      alert("Could not delete the event.");
    }
  }

  async function saveEdit(e) {
    e.preventDefault();
    try {
      await axios.put(`${API}/${editing._id}`, {
        eventName: editing.eventName,
        eventDescription: editing.eventDescription || "",
        eventDate: editing.eventDate,
        venue: editing.venue,
      });
      setEditing(null);
      await loadEvents();
    } catch {
      alert("Could not update the event.");
    }
  }

  const filtered = events.filter((event) =>
    `${event.eventName} ${event.venue}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const registrations = events.reduce(
    (sum, event) => sum + (event.totalRegistrations || 0),
    0
  );

  return (
    <>
      <header className="topbar">
        <div className="mobile-brand">Event<span>Admin</span></div>
        <div className="admin-profile">
          <span className="avatar">A</span>
          <span>Admin</span>
        </div>
      </header>

      <main className="main-content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">EVENT MANAGEMENT</p>
            <h1>Event Dashboard</h1>
            <p className="subtitle">
              Manage your events and registration details.
            </p>
          </div>
          <button className="primary-btn" onClick={() => navigate("/add-event")}>
            <PlusCircle size={18} /> Add Event
          </button>
        </div>

        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-icon blue"><CalendarDays /></div>
            <div><p>Total Events</p><h2>{events.length}</h2></div>
          </article>
          <article className="stat-card">
            <div className="stat-icon green"><Users /></div>
            <div><p>Total Registrations</p><h2>{registrations}</h2></div>
          </article>
          <article className="stat-card">
            <div className="stat-icon purple"><Clock /></div>
            <div><p>Upcoming Events</p><h2>{events.filter(e => new Date(e.eventDate) >= new Date(new Date().toDateString())).length}</h2></div>
          </article>
        </section>

        <section className="table-card">
          <div className="table-heading">
            <div><h2>All Events</h2><p>View and manage your events</p></div>
            <label className="search-box">
              <Search size={18} />
              <input
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>

          {error && <p className="error-message">{error}</p>}
          {loading ? <p className="empty-state">Loading events...</p> : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Event ID</th><th>Event Name</th><th>Event Date</th>
                    <th>Venue</th><th>Total Registrations</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((event, index) => (
                    <tr key={event._id}>
                      <td className="event-id">EVT{String(index + 1).padStart(3, "0")}</td>
                      <td><strong>{event.eventName}</strong></td>
                      <td>{new Date(event.eventDate).toLocaleDateString()}</td>
                      <td><span className="venue"><MapPin size={14}/>{event.venue}</span></td>
                      <td><span className="registration-count">{event.totalRegistrations || 0}</span></td>
                      <td>
                        <div className="action-buttons">
                          <button className="edit-btn" title="Edit event" onClick={() => setEditing({...event, eventDate: new Date(event.eventDate).toISOString().slice(0, 10)})}><Pencil size={15}/> Edit</button>
                          <button className="delete-btn" title="Delete event" onClick={() => deleteEvent(event._id)}><Trash2 size={15}/> Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr><td colSpan="6" className="empty-state">
                      {search ? "No matching events found." : "No events yet. Add your first event!"}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {editing && (
          <div className="modal-backdrop">
            <form className="event-form modal-form" onSubmit={saveEdit}>
              <div className="modal-heading"><h2>Update Event</h2><button type="button" className="close-btn" onClick={() => setEditing(null)}><X/></button></div>
              <label>Event Name<input required value={editing.eventName} onChange={e => setEditing({...editing, eventName:e.target.value})}/></label>
              <label>Event Description<textarea value={editing.eventDescription || ""} onChange={e => setEditing({...editing, eventDescription:e.target.value})}/></label>
              <label>Event Date<input type="date" required value={editing.eventDate} onChange={e => setEditing({...editing, eventDate:e.target.value})}/></label>
              <label>Venue<input required value={editing.venue} onChange={e => setEditing({...editing, venue:e.target.value})}/></label>
              <div className="form-actions"><button type="button" className="secondary-btn" onClick={() => setEditing(null)}>Cancel</button><button className="primary-btn">Save Changes</button></div>
            </form>
          </div>
        )}
      </main>
    </>
  );
}

function AddEvent() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    eventName: "", eventDescription: "", eventDate: "", venue: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await axios.post(API, form);
      navigate("/");
    } catch {
      setError("Could not save event. Check your backend and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="topbar">
        <div className="mobile-brand">Event<span>Admin</span></div>
        <div className="admin-profile"><span className="avatar">A</span><span>Admin</span></div>
      </header>
      <main className="main-content">
        <p className="eyebrow">EVENT MANAGEMENT</p>
        <h1>Add New Event</h1>
        <p className="subtitle">Enter the details below to create an event.</p>
        <form className="event-form" onSubmit={submit}>
          <label>Event Name<input name="eventName" placeholder="e.g. Annual Tech Fest" value={form.eventName} onChange={update} required/></label>
          <label>Event Description<textarea name="eventDescription" placeholder="Describe your event..." value={form.eventDescription} onChange={update}/></label>
          <div className="form-row">
            <label>Event Date<input type="date" name="eventDate" value={form.eventDate} onChange={update} required/></label>
            <label>Venue<input name="venue" placeholder="e.g. Main Auditorium" value={form.venue} onChange={update} required/></label>
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="form-actions">
            <button type="button" className="secondary-btn" onClick={() => navigate("/")}>Cancel</button>
            <button className="primary-btn" disabled={saving}>{saving ? "Saving..." : "Create Event"}</button>
          </div>
        </form>
      </main>
    </>
  );
}

function AppLayout() {
  const location = useLocation();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><CalendarDays size={30}/><span>Event<strong>Admin</strong></span></div>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          <NavLink end to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}><LayoutDashboard size={19}/> Dashboard</NavLink>
          <NavLink to="/add-event" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}><PlusCircle size={19}/> Add Event</NavLink>
        </nav>
        <div className="sidebar-footer"><span className="avatar">A</span><div><strong>Administrator</strong><small>Event Manager</small></div></div>
      </aside>
      <div className="content-area">
        <Routes>
          <Route path="/" element={<Dashboard key={location.pathname}/>} />
          <Route path="/add-event" element={<AddEvent/>} />
          <Route path="*" element={<Dashboard/>}/>
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return <BrowserRouter><AppLayout/></BrowserRouter>;
}
