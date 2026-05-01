const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const canAccessProject = async (userId, projectId, userRole) => {
  if (userRole === 'ADMIN') return true;
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  return !!member;
};

const isProjectAdmin = async (userId, projectId, userRole) => {
  if (userRole === 'ADMIN') return true;
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  return member?.role === 'ADMIN';
};

// GET /api/tasks?projectId=&status=&assigneeId=&priority=
router.get('/', authenticate, async (req, res) => {
  const { projectId, status, assigneeId, priority } = req.query;
  try {
    const where = {};
    if (projectId) {
      if (!(await canAccessProject(req.user.id, projectId, req.user.role))) {
        return res.status(403).json({ error: 'Access denied' });
      }
      where.projectId = projectId;
    } else {
      // Return tasks visible to user across all their projects
      if (req.user.role !== 'ADMIN') {
        const memberships = await prisma.projectMember.findMany({ where: { userId: req.user.id } });
        where.projectId = { in: memberships.map(m => m.projectId) };
      }
    }
    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId;
    if (priority) where.priority = priority;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks
router.post('/', authenticate, [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('projectId').notEmpty().withMessage('projectId required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, projectId, assigneeId, priority, dueDate, status } = req.body;
  try {
    if (!(await canAccessProject(req.user.id, projectId, req.user.role))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const task = await prisma.task.create({
      data: {
        title, description, projectId,
        assigneeId: assigneeId || null,
        priority: priority || 'MEDIUM',
        status: status || 'TODO',
        dueDate: dueDate ? new Date(dueDate) : null,
        creatorId: req.user.id,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });
    res.status(201).json({ task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (!(await canAccessProject(req.user.id, task.projectId, req.user.role))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tasks/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const admin = await isProjectAdmin(req.user.id, existing.projectId, req.user.role);
    const isCreator = existing.creatorId === req.user.id;
    const isAssignee = existing.assigneeId === req.user.id;

    // Members can update status of their own tasks; admins can update everything
    if (!admin && !isCreator && !isAssignee) {
      return res.status(403).json({ error: 'Not allowed to update this task' });
    }

    const { title, description, status, priority, assigneeId, dueDate } = req.body;
    const updateData = {};
    if (admin || isCreator) {
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (priority !== undefined) updateData.priority = priority;
      if (assigneeId !== undefined) updateData.assigneeId = assigneeId || null;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }
    if (status !== undefined) updateData.status = status;

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });
    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const admin = await isProjectAdmin(req.user.id, existing.projectId, req.user.role);
    if (!admin && existing.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Not allowed to delete this task' });
    }
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/comments
router.post('/:id/comments', authenticate, [
  body('content').trim().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (!(await canAccessProject(req.user.id, task.projectId, req.user.role))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const comment = await prisma.comment.create({
      data: { content: req.body.content, taskId: req.params.id, userId: req.user.id },
      include: { user: { select: { id: true, name: true } } },
    });
    res.status(201).json({ comment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
