import { PrismaClient } from '@/src/generated/prisma/client';
import {
  CreateMusicResourceInput,
  UpdateMusicResourceInput,
  CreateMusicCategoryInput,
  UpdateMusicCategoryInput,
  CreateMusicGoalInput,
  UpdateMusicGoalInput,
  CreateMusicInstructionInput,
  UpdateMusicInstructionInput,
} from "../validators/music.validators";

export class MusicRepository {
  constructor(private prisma: PrismaClient) {}

  // ====================================
  //        MUSIC RESOURCE OPERATIONS
  // ====================================

  async createMusicResource(data: CreateMusicResourceInput & { schoolId?: string }) {
    const { categoryIds, goalIds, schoolId, ...resourceData } = data;

    // Validate that categoryIds and goalIds exist before creating
    if (categoryIds && categoryIds.length > 0) {
      const existingCategories = await this.prisma.musicCategory.findMany({
        where: {
          id: { in: categoryIds },
          status: 'ACTIVE'
        }
      });
      
      const existingCategoryIds = existingCategories.map(cat => cat.id);
      const invalidCategoryIds = categoryIds.filter(id => !existingCategoryIds.includes(id));
      
      if (invalidCategoryIds.length > 0) {
        // Get all available categories for a helpful error message
        const allAvailableCategories = await this.prisma.musicCategory.findMany({
          where: { status: 'ACTIVE' },
          select: { id: true, name: true }
        });
        
        const availableCategoriesList = allAvailableCategories.map(c => `${c.id} (${c.name})`).join(', ');
        
        return {
          success: false,
          message: `Invalid music category IDs: ${invalidCategoryIds.join(', ')}. Available categories: ${availableCategoriesList}`,
          error: 'Music category validation failed'
        };
      }
    }

    if (goalIds && goalIds.length > 0) {
      const existingGoals = await this.prisma.musicGoal.findMany({
        where: {
          id: { in: goalIds },
          status: 'ACTIVE'
        }
      });
      
      const existingGoalIds = existingGoals.map(goal => goal.id);
      const invalidGoalIds = goalIds.filter(id => !existingGoalIds.includes(id));
      
      if (invalidGoalIds.length > 0) {
        // Get all available goals for a helpful error message
        const allAvailableGoals = await this.prisma.musicGoal.findMany({
          where: { status: 'ACTIVE' },
          select: { id: true, name: true }
        });
        
        const availableGoalsList = allAvailableGoals.map(g => `${g.id} (${g.name})`).join(', ');
        
        return {
          success: false,
          message: `Invalid music goal IDs: ${invalidGoalIds.join(', ')}. Available goals: ${availableGoalsList}`,
          error: 'Music goal validation failed'
        };
      }
    }

    // Only include schoolId if it's a valid UUID (not placeholder)
    const createData: any = {
      ...resourceData,
      categories: categoryIds ? {
        create: categoryIds.map(categoryId => ({
          categoryId,
        })),
      } : undefined,
      goals: goalIds ? {
        create: goalIds.map(goalId => ({
          goalId,
        })),
      } : undefined,
    };

    // Only add schoolId if it's provided and not a placeholder
    if (schoolId && schoolId !== "school_id") {
      createData.schoolId = schoolId;
    }

    const resource = await this.prisma.musicResource.create({
      data: createData,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        goals: {
          include: {
            goal: true,
          },
        },
        school: true,
      },
    });

    return resource;
  }

  async getMusicResources(filters: {
    category?: string;
    goal?: string;
    status?: string;
    page: number;
    limit: number;
    schoolId?: string;
  }) {
    const { category, goal, status, page, limit, schoolId } = filters;
    const skip = (page - 1) * limit;
    
    const where: any = {
      ...(status && { status }),
      // Only add schoolId filter if it's provided and not a placeholder
      ...(schoolId && schoolId !== "school_id" && { schoolId }),
    };

    if (category) {
      where.categories = {
        some: {
          category: {
            name: {
              contains: category,
              mode: "insensitive" as const,
            },
          },
        },
      };
    }

    if (goal) {
      where.goals = {
        some: {
          goal: {
            name: {
              contains: goal,
              mode: "insensitive" as const,
            },
          },
        },
      };
    }

    const [resources, total] = await Promise.all([
      this.prisma.musicResource.findMany({
        where,
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          goals: {
            include: {
              goal: true,
            },
          },
          school: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      this.prisma.musicResource.count({ where }),
    ]);

    return {
      resources,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMusicResourceById(id: string) {
    return await this.prisma.musicResource.findFirst({
      where: { id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        goals: {
          include: {
            goal: true,
          },
        },
        school: true,
      },
    });
  }

  async updateMusicResource(id: string, data: UpdateMusicResourceInput & { schoolId?: string }) {
    const { categoryIds, goalIds, schoolId, ...updateData } = data;

    // Handle category updates
    if (categoryIds !== undefined) {
      await this.prisma.musicResourceCategory.deleteMany({
        where: { musicResourceId: id },
      });
    }

    // Handle goal updates
    if (goalIds !== undefined) {
      await this.prisma.musicResourceGoal.deleteMany({
        where: { musicResourceId: id },
      });
    }

    // Only include schoolId in update if it's provided and not null
    const updatePayload: any = {
      ...updateData,
      categories: categoryIds ? {
        create: categoryIds.map(categoryId => ({
          categoryId,
        })),
      } : undefined,
      goals: goalIds ? {
        create: goalIds.map(goalId => ({
          goalId,
        })),
      } : undefined,
    };

    // Only add schoolId if it's a valid value (not null and not placeholder)
    if (schoolId && schoolId !== "school_id") {
      updatePayload.schoolId = schoolId;
    }

    return await this.prisma.musicResource.update({
      where: { id },
      data: updatePayload,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        goals: {
          include: {
            goal: true,
          },
        },
        school: true,
      },
    });
  }

  async deleteMusicResource(id: string) {
    return await this.prisma.musicResource.delete({
      where: { id },
    });
  }

  // ====================================
  //        MUSIC CATEGORY OPERATIONS
  // ====================================

  async createMusicCategory(data: CreateMusicCategoryInput) {
    return await this.prisma.musicCategory.create({
      data,
    });
  }

  async getMusicCategories(filters: { status?: string } = {}) {
    const { status } = filters;

    return await this.prisma.musicCategory.findMany({
      where: {
        ...(status && { status }),
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async getMusicCategoryById(id: string) {
    return await this.prisma.musicCategory.findUnique({
      where: { id },
      include: {
        musicResources: {
          include: {
            musicResource: true,
          },
        },
      },
    });
  }

  async updateMusicCategory(id: string, data: UpdateMusicCategoryInput) {
    return await this.prisma.musicCategory.update({
      where: { id },
      data,
    });
  }

  async deleteMusicCategory(id: string) {
    return await this.prisma.musicCategory.delete({
      where: { id },
    });
  }

  // ====================================
  //           MUSIC GOAL OPERATIONS
  // ====================================

  async createMusicGoal(data: CreateMusicGoalInput) {
    return await this.prisma.musicGoal.create({
      data,
    });
  }

  async getMusicGoals(filters: { status?: string } = {}) {
    const { status } = filters;

    return await this.prisma.musicGoal.findMany({
      where: {
        ...(status && { status }),
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async getMusicGoalById(id: string) {
    return await this.prisma.musicGoal.findUnique({
      where: { id },
      include: {
        musicResources: {
          include: {
            musicResource: true,
          },
        },
      },
    });
  }

  async updateMusicGoal(id: string, data: UpdateMusicGoalInput) {
    return await this.prisma.musicGoal.update({
      where: { id },
      data,
    });
  }

  async deleteMusicGoal(id: string) {
    return await this.prisma.musicGoal.delete({
      where: { id },
    });
  }

  // ====================================
  //      MUSIC INSTRUCTION OPERATIONS
  // ====================================

  async createMusicInstruction(data: CreateMusicInstructionInput & { schoolId?: string; createdBy?: string }) {
    // For MusicInstruction, createdBy is required in the schema
    // Use a dummy ID for now to satisfy the constraint
    const finalData = {
      ...data,
      createdBy: data.createdBy && data.createdBy !== 'admin@calmpath.ai' ? data.createdBy : 'dummy-user-id'
    };

    return await this.prisma.musicInstruction.create({
      data: finalData,
      include: {
        creator: true,
        school: true,
      },
    });
  }

  async getMusicInstructions(filters: {
    difficulty?: string;
    status?: string;
    page: number;
    limit: number;
    schoolId?: string;
  }) {
    const { difficulty, status, page, limit, schoolId } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(schoolId && { schoolId }),
      ...(status && { status }),
    };

    if (difficulty) {
      where.difficulty = difficulty;
    }

    const [instructions, total] = await Promise.all([
      this.prisma.musicInstruction.findMany({
        where,
        include: {
          creator: true,
          school: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      this.prisma.musicInstruction.count({ where }),
    ]);

    return {
      instructions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMusicInstructionById(id: string) {
    return await this.prisma.musicInstruction.findUnique({
      where: { id },
      include: {
        creator: true,
        school: true,
      },
    });
  }

  async updateMusicInstruction(id: string, data: UpdateMusicInstructionInput) {
    return await this.prisma.musicInstruction.update({
      where: { id },
      data,
      include: {
        creator: true,
        school: true,
      },
    });
  }

  async deleteMusicInstruction(id: string) {
    return await this.prisma.musicInstruction.delete({
      where: { id },
    });
  }

  async deleteAllMusicInstructions() {
    return await this.prisma.musicInstruction.deleteMany({});
  }

  async getInstructionsByResource(resourceId: string, filters: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { status = "PUBLISHED", page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      resourceId,
      status,
    };

    const [instructions, total] = await Promise.all([
      this.prisma.musicInstruction.findMany({
        where,
        include: {
          creator: true,
          school: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      this.prisma.musicInstruction.count({ where }),
    ]);

    return {
      instructions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ====================================
  //           STUDENT ACCESS METHODS
  // ====================================

  async getPublishedMusicResources(filters: {
    category?: string;
    goal?: string;
    page: number;
    limit: number;
    schoolId?: string;
  }) {
    return this.getMusicResources({
      ...filters,
      status: "PUBLISHED",
    });
  }

  async getPublishedMusicResourceById(id: string) {
    return await this.prisma.musicResource.findFirst({
      where: {
        id,
        status: "PUBLISHED",
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        goals: {
          include: {
            goal: true,
          },
        },
        school: true,
      },
    });
  }

  async getFeaturedMusic(limit: number = 10, schoolId?: string) {
    return await this.prisma.musicResource.findMany({
      where: {
        status: "PUBLISHED",
        ...(schoolId && { schoolId }),
        isPublic: true,
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        goals: {
          include: {
            goal: true,
          },
        },
        school: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });
  }

  async getPublishedMusicInstructions(filters: {
    difficulty?: string;
    page: number;
    limit: number;
    schoolId?: string;
  }) {
    return this.getMusicInstructions({
      ...filters,
      status: "PUBLISHED",
    });
  }

  async getPublishedMusicInstructionById(id: string) {
    return await this.prisma.musicInstruction.findFirst({
      where: {
        id,
        status: "PUBLISHED",
      },
      include: {
        creator: true,
        school: true,
      },
    });
  }

  async getPublishedInstructionsByResource(resourceId: string, filters: {
    page?: number;
    limit?: number;
  } = {}) {
    return this.getInstructionsByResource(resourceId, {
      ...filters,
      status: "PUBLISHED",
    });
  }
}
