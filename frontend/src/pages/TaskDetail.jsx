import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const STATUS_LABELS = { TODO: 'To do', IN_PROGRESS: 'In progress', IN_REVIEW: 'In review', DONE: 'Done' };
const STATUS_BADGE = { TODO: 'badge-todo', IN_PROGRESS: 'badge-inprogress', IN_REVIEW: 'badge-inreview', DONE: 'badge-done' };
const PRIORITY_BADGE = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high', URGENT: 'badge-urgent' };

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get(`/tasks/${id}`).then(res => {
      setTask(res.data.task);
      setForm({
        title: res.data.task.title,
        description: res.data.task.description || '',
        status: res.data.task.status,
        priority: res.data.task.priority,
        dueDate: res.data.task.dueDate ? format(new Date(res.data.task.dueDate), 'yyyy-MM-dd') : '',
      });
    }).catch(() => navigate(-1)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const canEdit = task && (user.role === 'ADMIN' || task.creatorId === user.id || task.assigneeId === user.id);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/tasks/${id}`, form);
      setEditing(false);
      load();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${id}`);
    navigate(-1);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSaving(true);
    try {
      await api.post(`/tasks/${id}/comments`, { content: comment });
      setComment('');
      load();
    } catch (err) { alert('Failed to post comment'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="page-center"><div className="spinner" /></div>;
  if (!task) return null;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div style={{ padding: '2rem', maxWidth: 780 }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: '1.25rem' }}>
        <Link to="/projects" style={{ color: 'var(--accent)' }}>Projects</Link>
        {' / '}
        <Link to={`/projects/${task.projectId}`} style={{ color: 'var(--accent)' }}>{task.project.name}</Link>
        {' / '}
        {task.title}
      </div>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        {editing ? (
          <>
            <div className="form-group">
              <label className="label">Title</label>
              <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <textarea className="input" rows={4} value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 1rem' }}>
              <div className="form-group">
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Priority</label>
                <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Due date</label>
                <input className="input" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <h1 style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.3 }}>{task.title}</h1>
              {canEdit && (
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              <span className={`badge ${STATUS_BADGE[task.status]}`}>{STATUS_LABELS[task.status]}</span>
              <span className={`badge ${PRIORITY_BADGE[task.priority]}`}>{task.priority.toLowerCase()}</span>
              {isOverdue && <span className="badge badge-overdue">Overdue</span>}
            </div>

            {task.description && (
              <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 16 }}>{task.description}</p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: 13 }}>
              {[
                { label: 'Project', value: task.project.name },
                { label: 'Assignee', value: task.assignee?.name || 'Unassigned' },
                { label: 'Created by', value: task.creator.name },
                { label: 'Due date', value: task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '—', red: isOverdue },
                { label: 'Created', value: format(new Date(task.createdAt), 'MMM d, yyyy') },
              ].map(({ label, value, red }) => (
                <div key={label} style={{ background: 'var(--bg3)', borderRadius: 6, padding: '8px 12px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontWeight: 500, color: red ? 'var(--red)' : 'var(--text)' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Quick status update */}
            {canEdit && (
              <div style={{ marginTop: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'var(--text3)', lineHeight: '28px' }}>Move to:</span>
                {STATUSES.filter(s => s !== task.status).map(s => (
                  <button key={s} className="btn btn-ghost btn-sm" onClick={async () => {
                    await api.put(`/tasks/${id}`, { status: s });
                    load();
                  }}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Comments */}
      <div className="card">
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: '1rem' }}>
          Comments ({task.comments?.length || 0})
        </h2>

        {task.comments?.map(c => (
          <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', background: 'var(--accent-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)', fontSize: 12, fontWeight: 600, flexShrink: 0,
            }}>
              {c.user.name[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{c.user.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{format(new Date(c.createdAt), 'MMM d, h:mm a')}</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 4, lineHeight: 1.5 }}>{c.content}</p>
            </div>
          </div>
        ))}

        <form onSubmit={handleComment} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input className="input" placeholder="Write a comment..." value={comment}
            onChange={e => setComment(e.target.value)} style={{ flex: 1 }} />
          <button className="btn btn-primary" type="submit" disabled={saving || !comment.trim()}>Post</button>
        </form>
      </div>
    </div>
  );
}
