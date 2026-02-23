import prisma from '@/src/prisma';

export class JournalingAdminRepository {
  // Journaling Config Management
  static async getJournalingConfig(schoolId: string) {
    return await prisma.journalingToolConfig.findUnique({
      where: { schoolId },
    });
  }

  static async createJournalingConfig(schoolId: string, config: any) {
    return await prisma.journalingToolConfig.create({
      data: {
        schoolId,
        ...config,
      },
    });
  }

  static async updateJournalingConfig(schoolId: string, config: any) {
    return await prisma.journalingToolConfig.upsert({
      where: { schoolId },
      update: config,
      create: {
        schoolId,
        ...config,
      },
    });
  }

  static async updateJournalingConfigWithTransaction(schoolId: string, config: any, tx: any) {
    return await tx.journalingToolConfig.upsert({
      where: { schoolId },
      update: config,
      create: {
        schoolId,
        ...config,
      },
    });
  }

  // Journaling Prompts Management
  static async createPrompt(text: string, moodIds: string[]) {
    return await prisma.journalingPrompt.create({
      data: {
        text,
        moodIds,
      },
    });
  }

  static async createGlobalPrompt(text: string, moodIds: string[]) {
    return await prisma.journalingPrompt.create({
      data: {
        text,
        moodIds,
        // No schoolId for global prompts
      },
    });
  }

  static async getAllPrompts() {
    return await prisma.journalingPrompt.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getPromptById(id: string) {
    return await prisma.journalingPrompt.findUnique({
      where: { id },
    });
  }

  static async updatePrompt(id: string, data: { text?: string; moodIds?: string[]; isEnabled?: boolean }) {
    return await prisma.journalingPrompt.update({
      where: { id },
      data: {
        ...(data.text !== undefined && { text: data.text }),
        ...(data.moodIds !== undefined && { moodIds: data.moodIds }),
        ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled })
      },
    });
  }

  static async updatePromptStatus(id: string, isEnabled: boolean) {
    return await prisma.journalingPrompt.update({
      where: { id },
      data: { isEnabled },
    });
  }

  static async deletePrompt(id: string) {
    return await prisma.journalingPrompt.delete({
      where: { id },
    });
  }

  // School verification for admin scope
  static async getAdminSchool(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        school: true,
        role: true,
      },
    });

    return user;
  }

  // Get all schools for global operations
  static async getAllSchools() {
    return await prisma.school.findMany({
      select: {
        id: true,
        name: true,
      },
    });
  }
}
