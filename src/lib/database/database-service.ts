import prisma from '@/src/prisma';

export class DatabaseService {
  static async getRecentSummary(studentId: string) {
    // Get the most recent summary for this student
    const summaries = await this.getStudentStructuredSummaries(studentId, 1);
    return summaries.length > 0 ? summaries[0] : null;
  }

  static async getStudentChatSessions(studentId: string, limit: number = 10) {
    return await prisma.chatSession.findMany({
      where: {
        user: {
          studentId: studentId
        }
      },
      orderBy: {
        startedAt: 'desc'
      },
      take: limit,
    });
  }
  static async connect() {
    try {
      await prisma.$connect();
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  static async disconnect() {
    try {
      await prisma.$disconnect();
      console.log('Database disconnected successfully');
    } catch (error) {
      console.error('Database disconnection failed:', error);
      throw error;
    }
  }

  static async healthCheck() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error: any) {
      return { status: 'unhealthy', error: error?.message || 'Unknown error', timestamp: new Date().toISOString() };
    }
  }

  // Mood checkin methods
  static async checkTodayMoodCheckin(studentId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await prisma.moodCheckin.findFirst({
      where: {
        userId: studentId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
  }

  static async getTodayMoodCheckin(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await prisma.moodCheckin.findFirst({
      where: {
        userId: userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
  }

  static async createMoodCheckin(data: { studentId: string; mood: string; notes?: string }) {
    return await prisma.moodCheckin.create({
      data: {
        userId: data.studentId,
        mood: data.mood,
        notes: data.notes,
      },
    });
  }

  static async createTriggerSelection(data: { studentId: string; triggers: string[]; notes?: string }) {
    return await prisma.triggerSelection.create({
      data: {
        userId: data.studentId,
        triggers: data.triggers,
        notes: data.notes,
      },
    });
  }

  static async getStudentMoodHistory(studentId: string, limit: number = 30) {
    return await prisma.moodCheckin.findMany({
      where: {
        userId: studentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  static async getMoodCheckin(checkinId: string) {
    return await prisma.moodCheckin.findUnique({
      where: {
        id: checkinId,
      },
    });
  }

  static async updateMoodCheckin(checkinId: string, updateData: any) {
    return await prisma.moodCheckin.update({
      where: {
        id: checkinId,
      },
      data: updateData,
    });
  }

  static async deleteMoodCheckin(checkinId: string) {
    return await prisma.moodCheckin.delete({
      where: {
        id: checkinId,
      },
    });
  }

  // User management methods
  static async getUserById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true
      }
    });
  }

  static async getUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email: email },
      include: {
        role: true
      }
    });
  }

  static async getUserByStudentId(studentId: string) {
    return await prisma.user.findUnique({
      where: { studentId: studentId },
      include: {
        role: true
      }
    });
  }

  static async createUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    roleId: string;
    schoolId?: string;
  }) {
    return await prisma.user.create({
      data: userData,
      include: {
        role: true
      }
    });
  }

  static async getChatSession(sessionId: string, studentId: string) {
    return await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: studentId,
      },
    });
  }

  static async createStructuredSummary(data: { sessionId: string; studentId: string; mainTopic: string; conversationStart: string; conversationAbout: string; reflection: string }) {
    return await prisma.summary.create({
      data: {
        sessionId: data.sessionId,
        userId: data.studentId,
        mainTopic: data.mainTopic,
        conversationStart: data.conversationStart,
        conversationAbout: data.conversationAbout,
        reflection: data.reflection,
      },
    });
  }

  static async getStructuredSummaryBySession(sessionId: string) {
    return await prisma.summary.findFirst({
      where: {
        sessionId: sessionId,
      },
    });
  }

  static async getStudentStructuredSummaries(studentId: string, limit: number = 20) {
    // PROPER SOLUTION: Get summaries by both userId and sessionId-based access
    // First get summaries by direct userId match
    const directSummaries = await prisma.summary.findMany({
      where: { userId: studentId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    
    // Then get summaries by checking chat sessions linked to studentId
    // First get chat sessions for this student
    const studentSessions = await prisma.chatSession.findMany({
      where: {
        user: {
          studentId: studentId
        }
      },
      select: { id: true, startedAt: true }
    });
    
    const sessionIds = studentSessions.map(s => s.id);
    
    // Then get summaries for those sessions
    const sessionSummaries = sessionIds.length > 0 ? await prisma.summary.findMany({
      where: {
        sessionId: { in: sessionIds }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }) : [];
    
    // Also get summaries by checking if the user who owns them has the matching studentId
    const userStudentIdSummaries = await prisma.summary.findMany({
      where: {
        user: {
          studentId: studentId
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    
    // Merge and deduplicate summaries
    const allSummaries = [...directSummaries, ...sessionSummaries, ...userStudentIdSummaries];
    const uniqueSummaries = allSummaries.filter((summary, index, self) => 
      index === self.findIndex(s => s.id === summary.id)
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
    
    return uniqueSummaries;
  }

  static async getStructuredSummaryById(summaryId: string) {
    return await prisma.summary.findUnique({
      where: {
        id: summaryId,
      },
    });
  }

  static async getStudentTriggerHistory(studentId: string, limit: number = 30) {
    return await prisma.triggerSelection.findMany({
      where: {
        userId: studentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  static async getTriggerSelection(selectionId: string) {
    return await prisma.triggerSelection.findUnique({
      where: {
        id: selectionId,
      },
    });
  }

  static async updateTriggerSelection(selectionId: string, updateData: { triggers: string[] }) {
    return await prisma.triggerSelection.update({
      where: {
        id: selectionId,
      },
      data: updateData,
    });
  }

  static async deleteTriggerSelection(selectionId: string) {
    await prisma.triggerSelection.delete({
      where: {
        id: selectionId,
      },
    });
  }

  static async getChatMessages(sessionId: string) {
    return await prisma.chatMessage.findMany({
      where: {
        sessionId: sessionId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}
