import prisma from '@/src/prisma';

export interface ActivityItem {
  id: string;
  type: 'mood' | 'journal' | 'meditation' | 'music' | 'badge' | 'streak' | 'session' | 'alert';
  studentId: string;
  studentName: string;
  classSection?: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Type description helper
const typeDescriptions: Record<string, string> = {
  mood: "Student mood check-in",
  journal: "Student journal entry",
  meditation: "Student meditation session",
  music: "Student music therapy session",
  badge: "Student earned badge",
  streak: "Student streak updated",
  session: "Student chat with buddy",
  alert: "Student alert triggered",
};

export class RecentActivityService {
  /**
   * Get recent activities with role-based filtering
   */
  static async getRecentActivities(
    adminId: string,
    filters: {
      search?: string;
      type?: string;
      classId?: string;
      schoolId?: string;
      dateRange?: string;
      timeFilter?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ activities: ActivityItem[]; total: number }> {
    const {
      search,
      type,
      classId,
      schoolId,
      dateRange,
      timeFilter,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = filters;

    // Get admin with role and school info
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        },
        school: true
      }
    });

    if (!admin) {
      throw new Error('Admin not found');
    }

    // Check if super admin (can view all schools)
    const isSuperAdmin = admin.role.name === 'SUPERADMIN' || 
      admin.role.name === 'SUPER_ADMIN' ||  // fallback for different naming
      admin.role.rolePermissions.some((rp: any) => rp.permission.name === 'VIEW_ALL_SCHOOLS') ||
      admin.role.rolePermissions.some((rp: any) => rp.permission.name === 'access.control.manage'); // Using actual permission

    // Build date filter using time filter logic
    const dateFilter = this.buildDateFilterFromTimeFilter(timeFilter, startDate, endDate);
    
    console.log('RecentActivityService: Date filter built', {
      timeFilter,
      startDate,
      endDate,
      dateFilter
    });

    // Determine school filter based on role and provided schoolId
    let effectiveSchoolId = undefined;
    if (schoolId && schoolId !== 'all') {
      // If specific school is provided, use it (only works for super admin)
      effectiveSchoolId = isSuperAdmin ? schoolId : admin.school?.id;
    } else if (!isSuperAdmin) {
      // Regular admin can only see their school
      effectiveSchoolId = admin.school?.id;
    }

    // Get all activities based on role permissions
    const activities = await this.fetchActivities({
      adminSchoolId: effectiveSchoolId,
      classId,
      search,
      type,
      dateFilter,
      limit,
      offset
    });

    // Get total count
    const total = await this.countActivities({
      adminSchoolId: effectiveSchoolId,
      classId,
      search,
      type,
      dateFilter
    });

    return { activities, total };
  }

  /**
   * Fetch activities from different tables
   */
  private static async fetchActivities(params: {
    adminSchoolId?: string;
    classId?: string;
    search?: string;
    type?: string;
    dateFilter?: { gte?: Date; lte?: Date };
    limit: number;
    offset: number;
  }): Promise<ActivityItem[]> {
    const { adminSchoolId, classId, search, type, dateFilter, limit, offset } = params;

    const activities: ActivityItem[] = [];

    // Build base user filter
    const userFilter: any = {};
    if (adminSchoolId) {
      userFilter.schoolId = adminSchoolId;
    }
    if (classId) {
      userFilter.classId = classId;
    }

    // Mood check-ins
    if (!type || type === 'mood') {
      // Build where clause with school filter
      const whereClause: any = {
        createdAt: dateFilter,
        ...(search && {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        })
      };
      
      // Add school filter directly to where clause
      if (adminSchoolId) {
        whereClause.user = {
          ...whereClause.user,
          schoolId: adminSchoolId
        };
      }
      
      if (classId) {
        whereClause.user = {
          ...whereClause.user,
          classId: classId
        };
      }
      
      const moodCheckins = await prisma.moodCheckin.findMany({
        where: whereClause,
        include: {
          user: {
            include: {
              classRef: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      activities.push(...moodCheckins.map((checkin: any) => ({
        id: `mood-${checkin.id}`,
        type: 'mood' as const,
        studentId: checkin.userId,
        studentName: `${checkin.user.firstName} ${checkin.user.lastName}`,
        classSection: checkin.user.classRef?.name,
        description: `Mood check-in submitted (${checkin.mood})`,
        timestamp: checkin.createdAt,
        metadata: { mood: checkin.mood }
      })));
    }

    // Journal entries (writing, audio, art)
    if (!type || type === 'journal') {
      // Writing journals
      const writingJournals = await prisma.writingJournal.findMany({
        where: {
          user: userFilter,
          createdAt: dateFilter,
          ...(search && {
            user: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
              ]
            }
          })
        },
        include: {
          user: {
            include: {
              classRef: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      activities.push(...writingJournals.map((journal: any) => ({
        id: `journal-writing-${journal.id}`,
        type: 'journal' as const,
        studentId: journal.userId,
        studentName: `${journal.user.firstName} ${journal.user.lastName}`,
        classSection: journal.user.classRef?.name,
        description: `Writing journaling entry added`,
        timestamp: journal.createdAt,
        metadata: { journalType: 'writing' }
      })));

      // Audio journals
      const audioJournals = await prisma.audioJournal.findMany({
        where: {
          user: userFilter,
          createdAt: dateFilter,
          ...(search && {
            user: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
              ]
            }
          })
        },
        include: {
          user: {
            include: {
              classRef: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      activities.push(...audioJournals.map((journal: any) => ({
        id: `journal-audio-${journal.id}`,
        type: 'journal' as const,
        studentId: journal.userId,
        studentName: `${journal.user.firstName} ${journal.user.lastName}`,
        classSection: journal.user.classRef?.name,
        description: `Audio journaling entry added`,
        timestamp: journal.createdAt,
        metadata: { journalType: 'audio' }
      })));

      // Art journals
      const artJournals = await prisma.artJournal.findMany({
        where: {
          user: userFilter,
          createdAt: dateFilter,
          ...(search && {
            user: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
              ]
            }
          })
        },
        include: {
          user: {
            include: {
              classRef: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      activities.push(...artJournals.map((journal: any) => ({
        id: `journal-art-${journal.id}`,
        type: 'journal' as const,
        studentId: journal.userId,
        studentName: `${journal.user.firstName} ${journal.user.lastName}`,
        classSection: journal.user.classRef?.name,
        description: `Art journaling entry added`,
        timestamp: journal.createdAt,
        metadata: { journalType: 'art' }
      })));
    }

    // Meditation sessions (using MeditationSave as session tracking)
    if (!type || type === 'meditation') {
      const meditationSaves = await prisma.meditationSave.findMany({
        where: {
          studentId: { not: null },
          createdAt: dateFilter
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      // Filter and enrich manually
      const filteredSaves = await Promise.all(
        meditationSaves.map(async (save) => {
          if (!save.studentId) return null;
          
          const [student, meditation] = await Promise.all([
            prisma.user.findUnique({
              where: { id: save.studentId },
              include: { classRef: true }
            }),
            prisma.meditation.findUnique({
              where: { id: save.meditationId }
            })
          ]);
          
          if (!student || !meditation) return null;
          
          // Apply filters
          if (adminSchoolId && student.schoolId !== adminSchoolId) return null;
          if (classId && student.classId !== classId) return null;
          if (search && !student.firstName?.toLowerCase().includes(search.toLowerCase()) && 
                   !student.lastName?.toLowerCase().includes(search.toLowerCase()) &&
                   !student.email?.toLowerCase().includes(search.toLowerCase())) return null;
          
          return {
            ...save,
            student,
            meditation
          };
        })
      );

      const validSaves = filteredSaves.filter(Boolean);

      activities.push(...validSaves.map((save: any) => ({
        id: `meditation-${save.id}`,
        type: 'meditation' as const,
        studentId: save.studentId!,
        studentName: `${save.student.firstName} ${save.student.lastName}`,
        classSection: save.student.classRef?.name,
        description: `Meditation session completed: ${save.meditation.title}`,
        timestamp: save.createdAt,
        metadata: { meditationId: save.meditationId }
      })));
    }

    // Badge earned
    if (!type || type === 'badge') {
      const userBadges = await prisma.userBadge.findMany({
        where: {
          user: userFilter,
          earnedAt: dateFilter,
          ...(search && {
            user: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
              ]
            }
          })
        },
        include: {
          user: {
            include: {
              classRef: true
            }
          },
          badge: true
        },
        orderBy: { earnedAt: 'desc' },
        take: limit,
        skip: offset
      });

      activities.push(...userBadges.map((userBadge: any) => ({
        id: `badge-${userBadge.id}`,
        type: 'badge' as const,
        studentId: userBadge.userId,
        studentName: `${userBadge.user.firstName} ${userBadge.user.lastName}`,
        classSection: userBadge.user.classRef?.name,
        description: `Badge earned: ${userBadge.badge.name}`,
        timestamp: userBadge.earnedAt,
        metadata: { badgeId: userBadge.badgeId }
      })));
    }

    // Streak updates
    if (!type || type === 'streak') {
      const streaks = await prisma.streak.findMany({
        where: {
          user: userFilter,
          lastActive: dateFilter,
          ...(search && {
            user: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
              ]
            }
          })
        },
        include: {
          user: {
            include: {
              classRef: true
            }
          }
        },
        orderBy: { lastActive: 'desc' },
        take: limit,
        skip: offset
      });

      activities.push(...streaks.map((streak: any) => ({
        id: `streak-${streak.id}`,
        type: 'streak' as const,
        studentId: streak.userId,
        studentName: `${streak.user.firstName} ${streak.user.lastName}`,
        classSection: streak.user.classRef?.name,
        description: `Streak updated: ${streak.count} days`,
        timestamp: streak.lastActive,
        metadata: { streakCount: streak.count }
      })));
    }

    // Chat sessions (bot interactions)
    if (!type || type === 'session') {
      const chatSessions = await prisma.chatSession.findMany({
        where: {
          user: userFilter,
          startedAt: dateFilter,
          ...(search && {
            user: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
              ]
            }
          })
        },
        include: {
          user: {
            include: {
              classRef: true
            }
          }
        },
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip: offset
      });

      activities.push(...chatSessions.map((chatSession: any) => ({
        id: `chat-${chatSession.id}`,
        type: 'session' as const,
        studentId: chatSession.userId,
        studentName: `${chatSession.user.firstName} ${chatSession.user.lastName}`,
        classSection: chatSession.user.classRef?.name,
        description: 'Chat session with buddy',
        timestamp: chatSession.startedAt,
        metadata: { chatSessionId: chatSession.id }
      })));
    }

    // Alert resolved and active alerts
    if (!type || type === 'alert') {
      // Get all alerts (both active and resolved) - apply date filter
      const allAlerts = await prisma.escalationAlert.findMany({
        where: {
          user: userFilter,
          createdAt: dateFilter,
          ...(search && {
            user: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
              ]
            }
          })
        },
        include: {
          user: {
            include: {
              classRef: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit * 2, // Get more to filter later
        skip: offset
      });

      // Filter and transform alerts
      const alertActivities = allAlerts.map((alert: any) => ({
        id: `alert-${alert.id}`,
        type: 'alert' as const,
        studentId: alert.studentId,
        studentName: `${alert.user.firstName} ${alert.user.lastName}`,
        classSection: alert.user.classRef?.name,
        description: alert.reason || `${alert.severity || 'medium'} alert triggered`,
        timestamp: alert.createdAt,
        metadata: { 
          alertId: alert.id,
          severity: alert.severity || 'medium',
          status: alert.status || 'active',
          reason: alert.reason
        }
      }));

      activities.push(...alertActivities);
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination after sorting
    return activities.slice(offset, offset + limit);
  }

  /**
   * Count total activities for pagination
   */
  private static async countActivities(params: {
    adminSchoolId?: string;
    classId?: string;
    search?: string;
    type?: string;
    dateFilter?: { gte?: Date; lte?: Date };
  }): Promise<number> {
    // For simplicity, return a count from mood checkins as a baseline
    // In production, you'd want to maintain a dedicated activity log table
    const { adminSchoolId, classId, search, type, dateFilter } = params;

    const userFilter: any = {};
    if (adminSchoolId) {
      userFilter.schoolId = adminSchoolId;
    }
    if (classId) {
      userFilter.classId = classId;
    }

    const whereClause: any = {
      user: userFilter,
      createdAt: dateFilter,
      ...(search && {
        user: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }
      })
    };

    if (type && type !== 'mood') {
      return 0; // Only count if type matches mood checkins
    }

    return await prisma.moodCheckin.count({ where: whereClause });
  }

  /**
   * Build date filter based on time filter parameters
   */
  private static buildDateFilterFromTimeFilter(
    timeFilter?: string, 
    startDate?: string, 
    endDate?: string
  ): { gte?: Date; lt?: Date } {
    if (startDate && endDate) {
      return {
        gte: new Date(startDate),
        lt: new Date(endDate)
      };
    }

    if (!timeFilter) {
      return {};
    }

    const now = new Date();
    const start = new Date();
    const end = new Date();

    switch (timeFilter) {
      case 'all':
        // For 'all', return a very wide date range to show everything
        start.setFullYear(now.getFullYear() - 10); // 10 years ago
        start.setHours(0, 0, 0, 0);
        end.setFullYear(now.getFullYear() + 1); // 1 year in future
        end.setHours(23, 59, 59, 999);
        break;
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        start.setDate(now.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() + (6 - dayOfWeek));
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    }

    return {
      gte: start,
      lt: end
    };
  }

  /**
   * Build date filter based on date range string
   */
  private static buildDateFilter(dateRange?: string): { gte?: Date; lte?: Date } {
    if (!dateRange || dateRange === 'all') {
      return {};
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateRange) {
      case 'today':
        return { gte: today };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { gte: yesterday, lte: today };
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { gte: weekAgo };
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return { gte: monthAgo };
      default:
        return {};
    }
  }

  /**
   * Get available classes for admin
   */
  static async getAvailableClasses(adminId: string): Promise<Array<{ id: string; name: string }>> {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        },
        school: {
          include: {
            classes: true
          }
        }
      }
    });

    if (!admin) {
      throw new Error('Admin not found');
    }

    const isSuperAdmin = admin.role.name === 'SUPERADMIN' || 
      admin.role.name === 'SUPER_ADMIN';

    if (isSuperAdmin) {
      // Super admin can see all classes
      return await prisma.class.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      });
    } else {
      // Regular admin can only see classes from their school
      return admin.school?.classes || [];
    }
  }

  /**
   * Get available schools for super admin
   */
  static async getAvailableSchools(): Promise<Array<{ id: string; name: string }>> {
    return await prisma.school.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
  }
}
