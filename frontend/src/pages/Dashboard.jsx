import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { format, isPast } from 'date-fns';

const statusBadge = { TODO: 'badge-todo', IN_PROGRESS: 'badge-inprogress', IN_REVIEW: 'badge-inreview', DONE: 'badge-done' };
const statusLabel = { TODO: 'To do', IN_PROGRESS: 'In progress', IN_REVIEW: 'In review', DONE: 'Done' };
const priorityBadge = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high', URGENT: 'badge-urgent' };

function StatCard({ label, value, sub, color }) {
  return (
    <div className="card" style={{ textAlign: 'center', borderTop: `2px solid ${color || 'var(--border)'}` }}>
      <div style={{ fontSize: 32, fontWeight: 600, color: color || 'var(--text)', lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-center"><div className="spinner" /></div>;
  const { stats, overdueTasks, recentTasks, myTasks } = data;

  return (
    <div style={{ padding: '2rem', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em' }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user.name.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text2)', marginTop: 4, fontSize: 14 }}>
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: '2rem' }}>
        <StatCard label="Total tasks" value={stats.totalTasks} color="var(--border2)" />
        <StatCard label="To do" value={stats.todo} color="var(--text3)" />
        <StatCard label="In progress" value={stats.inProgress} color="var(--blue)" />
        <StatCard label="In review" value={stats.inReview} color="var(--purple)" />
        <StatCard label="Done" value={stats.done} color="var(--green)" />
        <StatCard label="Overdue" value={stats.overdue} color="var(--red)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* My Tasks */}
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: '1rem' }}>My tasks</h2>
          {myTasks.length === 0
            ? <p style={{ color: 'var(--text3)', fontSize: 13 }}>No tasks assigned to you yet.</p>
            : myTasks.map(task => (
              <Link to={`/tasks/${task.id}`} key={task.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                padding: '10px 0', borderBottom: '1px solid var(--border)',
                gap: 8,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{task.project.name}</div>
                </div>
                <span className={`badge ${statusBadge[task.status]}`} style={{ flexShrink: 0 }}>
                  {statusLabel[task.status]}
                </span>
              </Link>
            ))}
        </div>

        {/* Overdue Tasks */}
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: '1rem', color: overdueTasks.length > 0 ? 'var(--red)' : 'var(--text)' }}>
            Overdue {overdueTasks.length > 0 && `(${overdueTasks.length})`}
          </h2>
          {overdueTasks.length === 0
            ? <p style={{ color: 'var(--text3)', fontSize: 13 }}>🎉 No overdue tasks!</p>
            : overdueTasks.map(task => (
              <Link to={`/tasks/${task.id}`} key={task.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                padding: '10px 0', borderBottom: '1px solid var(--border)',
                gap: 8,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 2 }}>
                    Due {format(new Date(task.dueDate), 'MMM d')} · {task.project.name}
                  </div>
                </div>
                <span className={`badge ${priorityBadge[task.priority]}`} style={{ flexShrink: 0 }}>
                  {task.priority.toLowerCase()}
                </span>
              </Link>
            ))}
        </div>

        {/* Recent Activity */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: '1rem' }}>Recent activity</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
            {recentTasks.map(task => (
              <Link to={`/tasks/${task.id}`} key={task.id} style={{
                display: 'block', padding: '10px 12px',
                background: 'var(--bg3)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                  <span className={`badge ${statusBadge[task.status]}`}>{statusLabel[task.status]}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>{task.project.name}</span>
                  {task.assignee && <span style={{ fontSize: 12, color: 'var(--text2)' }}>{task.assignee.name}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
