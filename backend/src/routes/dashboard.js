const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/dashboard
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    // Get projects user belongs to
    const memberships = await prisma.projectMember.findMany({ where: { userId } });
    const projectIds = memberships.map(m => m.projectId);

    const projectFilter = isAdmin ? {} : { projectId: { in: projectIds } };

    const [
      totalTasks,
      tasksByStatus,
      myTasks,
      overdueTasks,
      recentTasks,
      projects,
    ] = await Promise.all([
      prisma.task.count({ where: projectFilter }),

      prisma.task.groupBy({
        by: ['status'],
        where: projectFilter,
        _count: { status: true },
      }),

      prisma.task.findMany({
        where: { ...projectFilter, assigneeId: userId },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),

      prisma.task.findMany({
        where: {
          ...projectFilter,
          dueDate: { lt: new Date() },
          status: { not: 'DONE' },
        },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),

      prisma.task.findMany({
        where: projectFilter,
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 8,
      }),

      prisma.project.findMany({
        where: isAdmin ? {} : { id: { in: projectIds } },
        include: {
          _count: { select: { tasks: true, members: true } },
        },
      }),
    ]);

    const statusMap = {};
    tasksByStatus.forEach(s => { statusMap[s.status] = s._count.status; });

    res.json({
      stats: {
        totalProjects: projects.length,
        totalTasks,
        todo: statusMap['TODO'] || 0,
        inProgress: statusMap['IN_PROGRESS'] || 0,
        inReview: statusMap['IN_REVIEW'] || 0,
        done: statusMap['DONE'] || 0,
        overdue: overdueTasks.length,
      },
      myTasks,
      overdueTasks,
      recentTasks,
      projects,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
