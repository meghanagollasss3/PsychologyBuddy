import { PrismaClient } from "@/src/generated/prisma/client";
import { z } from "zod";
import {
  CreateMeditationResourceSchema,
  UpdateMeditationResourceSchema,
  CreateMeditationCategorySchema,
  UpdateMeditationCategorySchema,
  CreateMeditationGoalSchema,
  UpdateMeditationGoalSchema,
  CreateMeditationInstructionSchema,
  UpdateMeditationInstructionSchema,
} from "../validators/meditation.validators";

type CreateMeditationResourceInput = z.infer<typeof CreateMeditationResourceSchema>;
type UpdateMeditationResourceInput = z.infer<typeof UpdateMeditationResourceSchema>;
type CreateMeditationCategoryInput = z.infer<typeof CreateMeditationCategorySchema>;
type UpdateMeditationCategoryInput = z.infer<typeof UpdateMeditationCategorySchema>;
type CreateMeditationGoalInput = z.infer<typeof CreateMeditationGoalSchema>;
type UpdateMeditationGoalInput = z.infer<typeof UpdateMeditationGoalSchema>;
type CreateMeditationInstructionInput = z.infer<typeof CreateMeditationInstructionSchema>;
type UpdateMeditationInstructionInput = z.infer<typeof UpdateMeditationInstructionSchema>;

export class MeditationRepository {
  constructor(private prisma: PrismaClient) {}

  /* -------------------------------------------------- */
  /*                HELPER UTILITIES                    */
  /* -------------------------------------------------- */

  private mergeIds(primary?: string[], single?: string) {
    const ids = new Set(primary || []);
    if (single) ids.add(single);
    return [...ids];
  }

  /* -------------------------------------------------- */
  /*           MEDITATION RESOURCE OPERATIONS           */
  /* -------------------------------------------------- */

  async createMeditationResource(
    data: CreateMeditationResourceInput & { schoolId?: string; createdBy: string }
  ) {
    const {
      categoryIds,
      moodIds,
      goalIds,
      category,
      mood,
      goal,
      schoolId,
      createdBy,
      ...resourceData
    } = data;

    const allCategoryIds = this.mergeIds(categoryIds, category);
    const allMoodIds = this.mergeIds(moodIds, mood);
    const allGoalIds = this.mergeIds(goalIds, goal);

    /* ---------- Create Meditation ---------- */

    const meditation = await this.prisma.meditation.create({
      data: {
        ...resourceData,
        ...(schoolId && { schoolId }),
        createdBy,
      },
    });

    const meditationId = meditation.id;

    /* ---------- Create Relations ---------- */

    if (allCategoryIds.length) {
      await this.prisma.meditationMeditationCategory.createMany({
        data: allCategoryIds.map((categoryId) => ({
          meditationId,
          categoryId,
        })),
        skipDuplicates: true,
      });
    }

    if (allMoodIds.length) {
      await this.prisma.meditationMood.createMany({
        data: allMoodIds.map((moodId) => ({
          meditationId,
          moodId,
        })),
        skipDuplicates: true,
      });
    }

    if (allGoalIds.length) {
      await this.prisma.meditationMeditationGoal.createMany({
        data: allGoalIds.map((goalId) => ({
          meditationId,
          goalId,
        })),
        skipDuplicates: true,
      });
    }

    /* ---------- Return Full Resource ---------- */

    return this.prisma.meditation.findUnique({
      where: { id: meditationId },
      include: {
        moods: { include: { mood: true } },
        categories: { include: { category: true } },
        goals: { include: { goal: true } },
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /* -------------------------------------------------- */
  /*                GET MEDITATION LIST                 */
  /* -------------------------------------------------- */

  async getMeditationResources(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    format?: string;
    type?: string;
    categoryId?: string;
    moodId?: string;
    goalId?: string;
    schoolId?: string;
  }) {
    const {
      page,
      limit,
      search,
      status,
      format,
      type,
      categoryId,
      moodId,
      goalId,
      schoolId,
    } = params;

    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      ...(schoolId && { schoolId }),
      ...(status && { status }),
      ...(format && { format }),
      ...(type && { type }),
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { instructor: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categoryId || moodId || goalId) {
      where.AND = [];

      if (categoryId)
        where.AND.push({
          categories: { some: { category: { id: categoryId } } },
        });

      if (moodId)
        where.AND.push({
          moods: { some: { mood: { id: moodId } } },
        });

      if (goalId)
        where.AND.push({
          goals: { some: { goal: { id: goalId } } },
        });
    }

    const [meditations, total] = await this.prisma.$transaction([
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

          categories: {
            select: {
              category: { select: { id: true, name: true } },
            },
          },

          moods: {
            select: {
              mood: { select: { id: true, name: true } },
            },
          },

          goals: {
            select: {
              goal: { select: { id: true, name: true } },
            },
          },

          admin: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),

      this.prisma.meditation.count({ where }),
    ]);

    return { meditations, total };
  }

  /* -------------------------------------------------- */
  /*              GET SINGLE MEDITATION                 */
  /* -------------------------------------------------- */

  async getMeditationResourceById(id: string, schoolId?: string) {
    return this.prisma.meditation.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(schoolId && { schoolId }),
      },
      include: {
        moods: { include: { mood: true } },
        categories: { include: { category: true } },
        goals: { include: { goal: true } },
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /* -------------------------------------------------- */
  /*                UPDATE MEDITATION                   */
  /* -------------------------------------------------- */

  async updateMeditationResource(
    id: string,
    data: UpdateMeditationResourceInput & { schoolId?: string }
  ) {
    const { categoryIds, moodIds, goalIds, schoolId, ...updateData } = data;

    const meditation = await this.prisma.meditation.update({
      where: { id },
      data: {
        ...updateData,
        ...(schoolId && { schoolId }),
      },
    });

    if (categoryIds !== undefined) {
      await this.prisma.meditationMeditationCategory.deleteMany({
        where: { meditationId: id },
      });

      if (categoryIds.length) {
        await this.prisma.meditationMeditationCategory.createMany({
          data: categoryIds.map((categoryId) => ({
            meditationId: id,
            categoryId,
          })),
          skipDuplicates: true,
        });
      }
    }

    if (moodIds !== undefined) {
      await this.prisma.meditationMood.deleteMany({
        where: { meditationId: id },
      });

      if (moodIds.length) {
        await this.prisma.meditationMood.createMany({
          data: moodIds.map((moodId) => ({
            meditationId: id,
            moodId,
          })),
          skipDuplicates: true,
        });
      }
    }

    if (goalIds !== undefined) {
      await this.prisma.meditationMeditationGoal.deleteMany({
        where: { meditationId: id },
      });

      if (goalIds.length) {
        await this.prisma.meditationMeditationGoal.createMany({
          data: goalIds.map((goalId) => ({
            meditationId: id,
            goalId,
          })),
          skipDuplicates: true,
        });
      }
    }

    return meditation;
  }

  /* -------------------------------------------------- */
  /*               DELETE (SOFT DELETE)                 */
  /* -------------------------------------------------- */

  async deleteMeditationResource(id: string) {
    return this.prisma.meditation.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: "ARCHIVED",
      },
    });
  }

  /* -------------------------------------------------- */
  /*                 CATEGORY CRUD                      */
  /* -------------------------------------------------- */

  async createMeditationCategory(data: CreateMeditationCategoryInput) {
    return this.prisma.meditationCategory.create({ data });
  }

  async getMeditationCategories(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
  }) {
    const { page, limit, search, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [categories, total] = await this.prisma.$transaction([
      this.prisma.meditationCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.meditationCategory.count({ where }),
    ]);

    return { categories, total };
  }

  async updateMeditationCategory(id: string, data: UpdateMeditationCategoryInput) {
    return this.prisma.meditationCategory.update({
      where: { id },
      data,
    });
  }

  async deleteMeditationCategory(id: string) {
    return this.prisma.meditationCategory.delete({
      where: { id },
    });
  }

  /* -------------------------------------------------- */
  /*                     GOALS CRUD                     */
  /* -------------------------------------------------- */

  async createMeditationGoal(data: CreateMeditationGoalInput) {
    return this.prisma.meditationGoal.create({ data });
  }

  async getMeditationGoals(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
  }) {
    const { page, limit, search, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [goals, total] = await this.prisma.$transaction([
      this.prisma.meditationGoal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.meditationGoal.count({ where }),
    ]);

    return { goals, total };
  }

  async updateMeditationGoal(id: string, data: UpdateMeditationGoalInput) {
    return this.prisma.meditationGoal.update({
      where: { id },
      data,
    });
  }

  async deleteMeditationGoal(id: string) {
    return this.prisma.meditationGoal.delete({
      where: { id },
    });
  }

  /* -------------------------------------------------- */
  /*            MEDITATION INSTRUCTIONS CRUD            */
  /* -------------------------------------------------- */

  async createMeditationInstruction(
    data: CreateMeditationInstructionInput & {
      schoolId?: string;
      createdBy?: string;
    }
  ) {
    return this.prisma.meditationListeningInstruction.create({
      data: {
        ...data,
      },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true } },
        school: { select: { id: true, name: true } },
      },
    });
  }

  async deleteMeditationInstruction(id: string) {
    return this.prisma.meditationListeningInstruction.delete({
      where: { id },
    });
  }
}