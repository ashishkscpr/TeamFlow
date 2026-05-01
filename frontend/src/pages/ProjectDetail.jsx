import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const STATUS_LABELS = { TODO: 'To do', IN_PROGRESS: 'In progress', IN_REVIEW: 'In review', DONE: 'Done' };
const STATUS_COLORS = { TODO: 'var(--text3)', IN_PROGRESS: 'var(--blue)', IN_REVIEW: 'var(--purple)', DONE: 'var(--green)' };
const PRIORITY_BADGE = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high', URGENT: 'badge-urgent' };

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('board');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'MEDIUM', assigneeId: '', dueDate: '', status: 'TODO' });
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    api.get(`/projects/${id}`).then(res => setProject(res.data.project)).catch(() => navigate('/projects')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const myMembership = project?.members?.find(m => m.userId === user.id);
  const isAdmin = user.role === 'ADMIN' || myMembership?.role === 'ADMIN';

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      await api.post('/tasks', { ...taskForm, projectId: id, assigneeId: taskForm.assigneeId || undefined });
      setTaskForm({ title: '', description: '', priority: 'MEDIUM', assigneeId: '', dueDate: '', status: 'TODO' });
      setShowTaskForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    } finally { setSaving(false); }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail, role: memberRole });
      setMemberEmail(''); setShowMemberForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    } finally { setSaving(false); }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      load();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    try {
      await api.delete(`/projects/${id}`);
      navigate('/projects');
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      load();
    } catch (err) { alert('Could not update task'); }
  };

  if (loading) return <div className="page-center"><div className="spinner" /></div>;
  if (!project) return null;

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = project.tasks.filter(t => t.status === s);
    return acc;
  }, {});

  return (
    <div style={{ padding: '2rem', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 6 }}>
          <Link to="/projects" style={{ color: 'var(--accent)' }}>Projects</Link> / {project.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600 }}>{project.name}</h1>
            {project.description && <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>{project.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {isAdmin && (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowTaskForm(!showTaskForm)}>+ Add task</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowMemberForm(!showMemberForm)}>+ Add member</button>
                <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>Delete</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        {['board', 'members'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 16px', fontSize: 14, fontWeight: 500,
            color: activeTab === tab ? 'var(--text)' : 'var(--text2)',
            borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -1, transition: 'all 0.12s', background: 'none',
          }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Task Form */}
      {showTaskForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: '1rem' }}>New task</h2>
          <form onSubmit={handleCreateTask}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="label">Title</label>
                <input className="input" placeholder="Task title" value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="label">Description</label>
                <textarea className="input" rows={2} placeholder="Optional description" value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="label">Priority</label>
                <select className="input" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Status</label>
                <select className="input" value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Assign to</label>
                <select className="input" value={taskForm.assigneeId} onChange={e => setTaskForm({ ...taskForm, assigneeId: e.target.value })}>
                  <option value="">Unassigned</option>
                  {project.members.map(m => (
                    <option key={m.userId} value={m.userId}>{m.user.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Due date</label>
                <input className="input" type="date" value={taskForm.dueDate}
                  onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
              </div>
            </div>
            {error && <p className="error-msg">{error}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create task'}</button>
              <button className="btn btn-ghost" type="button" onClick={() => setShowTaskForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Member Form */}
      {showMemberForm && (
        <div className="card" style={{ marginBottom: '1.5rem', maxWidth: 480 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: '1rem' }}>Add member</h2>
          <form onSubmit={handleAddMember}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" type="email" placeholder="Email address" value={memberEmail}
                onChange={e => setMemberEmail(e.target.value)} required style={{ flex: 1 }} />
              <select className="input" value={memberRole} onChange={e => setMemberRole(e.target.value)} style={{ width: 120 }}>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
              <button className="btn btn-primary" type="submit" disabled={saving}>Add</button>
              <button className="btn btn-ghost" type="button" onClick={() => setShowMemberForm(false)}>Cancel</button>
            </div>
            {error && <p className="error-msg" style={{ marginTop: 8 }}>{error}</p>}
          </form>
        </div>
      )}

      {/* Board View */}
      {activeTab === 'board' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '1rem', overflowX: 'auto' }}>
          {STATUSES.map(status => (
            <div key={status}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[status], display: 'inline-block' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>{STATUS_LABELS[status]}</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>{tasksByStatus[status].length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tasksByStatus[status].map(task => (
                  <div key={task.id} className="card" style={{ padding: '12px', cursor: 'pointer' }}
                    onClick={() => navigate(`/tasks/${task.id}`)}>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, lineHeight: 1.4 }}>{task.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, flexWrap: 'wrap' }}>
                      <span className={`badge ${PRIORITY_BADGE[task.priority]}`}>{task.priority.toLowerCase()}</span>
                      {task.assignee && (
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{task.assignee.name.split(' ')[0]}</span>
                      )}
                    </div>
                    {task.dueDate && (
                      <div style={{ fontSize: 11, color: new Date(task.dueDate) < new Date() ? 'var(--red)' : 'var(--text3)', marginTop: 6 }}>
                        Due {format(new Date(task.dueDate), 'MMM d')}
                      </div>
                    )}
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
                        {STATUSES.filter(s => s !== status).map(s => (
                          <button key={s} className="btn btn-ghost" style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4 }}
                            onClick={e => { e.stopPropagation(); updateTaskStatus(task.id, s); }}>
                            → {STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {tasksByStatus[status].length === 0 && (
                  <div style={{ padding: '1.5rem', background: 'var(--bg2)', border: '1px dashed var(--border2)', borderRadius: 'var(--radius)', textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
                    No tasks
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Members View */}
      {activeTab === 'members' && (
        <div style={{ maxWidth: 600 }}>
          {project.members.map(m => (
            <div key={m.userId} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px', background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', marginBottom: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--accent-dim)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent)', fontSize: 14, fontWeight: 600,
                }}>
                  {m.user.name[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{m.user.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{m.user.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`badge ${m.role === 'ADMIN' ? 'badge-admin' : 'badge-member'}`}>
                  {m.role.toLowerCase()}
                </span>
                {isAdmin && m.userId !== user.id && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m.userId)}>Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
