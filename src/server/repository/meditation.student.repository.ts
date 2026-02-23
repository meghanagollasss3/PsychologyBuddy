import { PrismaClient } from '@/src/generated/prisma/client';

export class MeditationStudentRepository {
  constructor(private prisma: PrismaClient) {}

  // ====================================
  //        STUDENT MEDITATION OPERATIONS
  // ====================================

  async getStudentMeditations(params: {
    page: number;
    limit: number;
    search?: string;
    categoryId?: string;
    moodId?: string;
    goalId?: string;
    format?: string;
    type?: string;
    schoolId?: string;
  }) {
    const { page, limit, search, categoryId, moodId, goalId, format, type, schoolId } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null, // Exclude soft-deleted records
      status: "PUBLISHED", // Only show published meditations to students
      ...(schoolId && { schoolId }),
      ...(format && { format }),
      ...(type && { type }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { instructor: { contains: search, mode: "insensitive" } }
        ]
      })
    };

    if (categoryId || moodId || goalId) {
      where.AND = [];
      if (categoryId) {
        where.AND.push({
          categories: {
            some: {
              category: { id: categoryId }
            }
          }
        });
      }
      if (moodId) {
        where.AND.push({
          moods: {
            some: {
              mood: { id: moodId }
            }
          }
        });
      }
      if (goalId) {
        where.AND.push({
          goals: {
            some: {
              goal: { id: goalId }
            }
          }
        });
      }
    }

    const [meditations, total] = await Promise.all([
      this.prisma.meditation.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          format: true,
          durationSec: true,
          instructor: true,
          type: true,
          status: true,
          audioUrl: true,
          videoUrl: true,
          createdAt: true,
          updatedAt: true,
          // Include minimal relation data for list view
          categories: {
            select: {
              id: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          moods: {
            select: {
              id: true,
              mood: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          goals: {
            select: {
              id: true,
              goal: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          admin: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc"
        }
      }),
      this.prisma.meditation.count({ where })
    ]);

    return { meditations, total };
  }

  async getStudentMeditationById(id: string, schoolId?: string) {
    return this.prisma.meditation.findFirst({
      where: { 
        id,
        deletedAt: null, // Exclude soft-deleted records
        status: "PUBLISHED", // Only show published meditations to students
        ...(schoolId && { schoolId }),
      },
      include: {
        moods: {
          include: {
            mood: true
          }
        },
        categories: {
          include: {
            category: true
          }
        },
        goals: {
          include: {
            goal: true
          }
        },
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
  }

  async searchStudentMeditations(params: {
    page: number;
    limit: number;
    search: string;
    format?: string;
    type?: string;
    schoolId?: string;
  }) {
    const { page, limit, search, format, type, schoolId } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null, // Exclude soft-deleted records
      status: "PUBLISHED", // Only show published meditations to students
      ...(schoolId && { schoolId }),
      ...(format && { format }),
      ...(type && { type }),
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { instructor: { contains: search, mode: "insensitive" } }
      ]
    };

    const [meditations, total] = await Promise.all([
      this.prisma.meditation.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          format: true,
          durationSec: true,
          instructor: true,
          type: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          // Include minimal relation data for search results
          categories: {
            select: {
              id: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          moods: {
            select: {
              id: true,
              mood: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          goals: {
            select: {
              id: true,
              goal: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          admin: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc"
        }
      }),
      this.prisma.meditation.count({ where })
    ]);

    return { meditations, total };
  }

  // ====================================
  //        STUDENT CATEGORY OPERATIONS
  // ====================================

  async getStudentMeditationCategories(params: {
    page: number;
    limit: number;
    search?: string;
    schoolId?: string;
  }) {
    const { page, limit, search, schoolId } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      status: "ACTIVE", // Only show active categories to students
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }

    const [categories, total] = await Promise.all([
      this.prisma.meditationCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          name: "asc"
        }
      }),
      this.prisma.meditationCategory.count({ where })
    ]);

    return { categories, total };
  }

  async getStudentMeditationCategoryById(id: string) {
    return this.prisma.meditationCategory.findFirst({
      where: { 
        id,
        status: "ACTIVE" // Only show active categories to students
      }
    });
  }

  // ====================================
  //           STUDENT GOAL OPERATIONS
  // ====================================

  async getStudentMeditationGoals(params: {
    page: number;
    limit: number;
    search?: string;
    schoolId?: string;
  }) {
    const { page, limit, search, schoolId } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }

    const [goals, total] = await Promise.all([
      this.prisma.meditationGoal.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          name: "asc"
        }
      }),
      this.prisma.meditationGoal.count({ where })
    ]);

    return { goals, total };
  }

  async getStudentMeditationGoalById(id: string) {
    return this.prisma.meditationGoal.findUnique({
      where: { id }
    });
  }

  // ====================================
  //     STUDENT INSTRUCTION OPERATIONS
  // ====================================

  async getStudentMeditationInstructions(params: {
    page: number;
    limit: number;
    search?: string;
    difficulty?: string;
    schoolId?: string;
  }) {
    const { page, limit, search, difficulty, schoolId } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      status: "PUBLISHED", // Only show published instructions to students
      ...(schoolId && { schoolId }),
      ...(difficulty && { difficulty }),
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }

    const [instructions, total] = await Promise.all([
      this.prisma.meditationListeningInstruction.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          duration: true,
          difficulty: true,
          status: true,
          resourceId: true,
          createdAt: true,
          updatedAt: true,
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          school: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }),
      this.prisma.meditationListeningInstruction.count({ where })
    ]);

    return { instructions, total };
  }

  async getStudentMeditationInstructionById(id: string, schoolId?: string) {
    return this.prisma.meditationListeningInstruction.findFirst({
      where: { 
        id,
        status: "PUBLISHED", // Only show published instructions to students
        ...(schoolId && { schoolId }),
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        school: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }

  async getStudentInstructionsByResource(resourceId: string, schoolId?: string) {
    return this.prisma.meditationListeningInstruction.findMany({
      where: { 
        resourceId,
        status: "PUBLISHED", // Only show published instructions to students
        ...(schoolId && { schoolId }),
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        school: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }
}
