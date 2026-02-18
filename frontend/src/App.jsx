import { useEffect, useMemo, useState } from 'react';
import {
  CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  classifyDescription,
  createTicket,
  fetchStats,
  fetchTickets,
  patchTicket,
} from './api';
import './App.css';

const initialForm = {
  title: '',
  description: '',
  category: 'general',
  priority: 'medium',
};

function formatDate(dateString) {
  return new Date(dateString).toLocaleString();
}

function truncate(text, limit = 160) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}...`;
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function App() {
  const [form, setForm] = useState(initialForm);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ category: '', priority: '', status: '', search: '' });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isClassifying, setIsClassifying] = useState(false);

  const [formError, setFormError] = useState('');
  const [globalError, setGlobalError] = useState('');

  useEffect(() => {
    loadTickets();
  }, [filters.category, filters.priority, filters.status, filters.search]);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    const description = form.description.trim();
    if (description.length < 20) {
      return undefined;
    }

    const timeoutId = setTimeout(async () => {
      setIsClassifying(true);
      try {
        const result = await classifyDescription(description);
        setForm((current) => ({
          ...current,
          category: result.suggested_category || current.category,
          priority: result.suggested_priority || current.priority,
        }));
      } catch {
        // Ignore classification failures so ticket creation still works.
      } finally {
        setIsClassifying(false);
      }
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [form.description]);

  async function loadTickets() {
    setIsLoadingTickets(true);
    setGlobalError('');
    try {
      const data = await fetchTickets(filters);
      setTickets(data);
    } catch {
      setGlobalError('Could not load tickets.');
    } finally {
      setIsLoadingTickets(false);
    }
  }

  async function loadStats() {
    setIsLoadingStats(true);
    try {
      const data = await fetchStats();
      setStats(data);
    } catch {
      setGlobalError('Could not load stats.');
    } finally {
      setIsLoadingStats(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const created = await createTicket(form);
      setTickets((current) => [created, ...current]);
      setForm(initialForm);
      await loadStats();
    } catch (error) {
      const apiErrors = error.payload || {};
      const firstField = Object.keys(apiErrors)[0];
      const message = firstField ? `${firstField}: ${apiErrors[firstField][0]}` : 'Failed to submit ticket.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusChange(ticketId, newStatus) {
    try {
      const updated = await patchTicket(ticketId, { status: newStatus });
      setTickets((current) => current.map((ticket) => (ticket.id === ticketId ? updated : ticket)));
      await loadStats();
    } catch {
      setGlobalError('Could not update ticket status.');
    }
  }

  const visibleTickets = useMemo(() => tickets, [tickets]);

  return (
    <div className="app">
      <header>
        <h1>Support Ticket System</h1>
        <p>Submit tickets, review LLM suggestions, and monitor support operations.</p>
      </header>

      {globalError ? <p className="error">{globalError}</p> : null}

      <section className="card">
        <h2>Create Ticket</h2>
        <form onSubmit={handleSubmit} className="ticket-form">
          <label>
            Title
            <input
              type="text"
              maxLength={200}
              required
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
          </label>

          <label>
            Description
            <textarea
              required
              rows={5}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </label>

          {isClassifying ? <p className="hint">Classifying description with LLM...</p> : null}

          <div className="row">
            <label>
              Category
              <select
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Priority
              <select
                value={form.priority}
                onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
          </button>

          {formError ? <p className="error">{formError}</p> : null}
        </form>
      </section>

      <section className="card">
        <h2>Stats Dashboard</h2>
        {isLoadingStats || !stats ? (
          <p className="hint">Loading stats...</p>
        ) : (
          <>
            <div className="stats-grid">
              <StatCard label="Total Tickets" value={stats.total_tickets} />
              <StatCard label="Open Tickets" value={stats.open_tickets} />
              <StatCard label="Avg Tickets / Day" value={stats.avg_tickets_per_day} />
            </div>

            <div className="breakdowns">
              <div>
                <h3>Priority Breakdown</h3>
                <ul>
                  {Object.entries(stats.priority_breakdown).map(([key, value]) => (
                    <li key={key}>
                      <span>{key}</span>
                      <strong>{value}</strong>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Category Breakdown</h3>
                <ul>
                  {Object.entries(stats.category_breakdown).map(([key, value]) => (
                    <li key={key}>
                      <span>{key}</span>
                      <strong>{value}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="card">
        <h2>Tickets</h2>

        <div className="filters">
          <input
            type="search"
            placeholder="Search title and description"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          />
          <select
            value={filters.category}
            onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
          >
            <option value="">All Categories</option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            value={filters.priority}
            onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}
          >
            <option value="">All Priorities</option>
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {isLoadingTickets ? (
          <p className="hint">Loading tickets...</p>
        ) : visibleTickets.length === 0 ? (
          <p className="hint">No tickets found.</p>
        ) : (
          <div className="ticket-list">
            {visibleTickets.map((ticket) => (
              <article key={ticket.id} className="ticket-item">
                <h3>{ticket.title}</h3>
                <p>{truncate(ticket.description)}</p>
                <div className="meta">
                  <span>Category: {ticket.category}</span>
                  <span>Priority: {ticket.priority}</span>
                  <span>Created: {formatDate(ticket.created_at)}</span>
                </div>
                <label>
                  Status
                  <select
                    value={ticket.status}
                    onChange={(event) => handleStatusChange(ticket.id, event.target.value)}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;