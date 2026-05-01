import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    api.get('/projects').then(res => setProjects(res.data.projects)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      await api.post('/projects', form);
      setForm({ name: '', description: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="page-center"><div className="spinner" /></div>;

  return (
    <div style={{ padding: '2rem', maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Projects</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 2 }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          + New project
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: '1rem' }}>New project</h2>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="label">Project name</label>
              <input className="input" placeholder="e.g. Q3 Marketing Campaign"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="label">Description (optional)</label>
              <textarea className="input" rows={2} placeholder="What's this project about?"
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                style={{ resize: 'vertical' }} />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: '0.5rem' }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Creating...' : 'Create project'}
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Projects grid */}
      {projects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⬡</div>
          <p style={{ color: 'var(--text2)' }}>No projects yet. Create your first one!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {projects.map(p => (
            <Link key={p.id} to={`/projects/${p.id}`} className="card" style={{
              display: 'block', transition: 'border-color 0.15s',
              borderColor: 'var(--border)',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'var(--accent-dim)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent)', fontSize: 16, fontWeight: 600, flexShrink: 0,
                }}>
                  {p.name[0].toUpperCase()}
                </div>
                <span className={`badge ${p.myRole === 'ADMIN' ? 'badge-admin' : 'badge-member'}`}>
                  {p.myRole?.toLowerCase()}
                </span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 12, marginBottom: 4 }}>{p.name}</h3>
              {p.description && (
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {p.description}
                </p>
              )}
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text3)', marginTop: 12 }}>
                <span>{p._count?.tasks ?? 0} tasks</span>
                <span>{p.members?.length ?? 0} members</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
