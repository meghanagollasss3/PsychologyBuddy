import prisma from "@/src/prisma";
import { z } from "zod";
import { MeditationRepository } from "../repository/meditation.repository";
import {
  CreateMeditationResourceSchema,
  UpdateMeditationResourceSchema,
  GetMeditationResourcesSchema,
  GetSingleMeditationResourceSchema,
  CreateMeditationCategorySchema,
  UpdateMeditationCategorySchema,
  GetMeditationCategoriesSchema,
  GetSingleMeditationCategorySchema,
  CreateMeditationGoalSchema,
  UpdateMeditationGoalSchema,
  GetMeditationGoalsSchema,
  GetSingleMeditationGoalSchema,
  CreateMeditationInstructionSchema,
  UpdateMeditationInstructionSchema,
  GetMeditationInstructionsSchema,
  GetSingleMeditationInstructionSchema,
  GetInstructionsByResourceSchema,
} from "../validators/meditation.validators";

type CreateMeditationResourceInput = z.infer<typeof CreateMeditationResourceSchema>;
type UpdateMeditationResourceInput = z.infer<typeof UpdateMeditationResourceSchema>;
type GetMeditationResourcesInput = z.infer<typeof GetMeditationResourcesSchema>;
type GetSingleMeditationResourceInput = z.infer<typeof GetSingleMeditationResourceSchema>;
type CreateMeditationCategoryInput = z.infer<typeof CreateMeditationCategorySchema>;
type UpdateMeditationCategoryInput = z.infer<typeof UpdateMeditationCategorySchema>;
type GetMeditationCategoriesInput = z.infer<typeof GetMeditationCategoriesSchema>;
type GetSingleMeditationCategoryInput = z.infer<typeof GetSingleMeditationCategorySchema>;
type CreateMeditationGoalInput = z.infer<typeof CreateMeditationGoalSchema>;
type UpdateMeditationGoalInput = z.infer<typeof UpdateMeditationGoalSchema>;
type GetMeditationGoalsInput = z.infer<typeof GetMeditationGoalsSchema>;
type GetSingleMeditationGoalInput = z.infer<typeof GetSingleMeditationGoalSchema>;
type CreateMeditationInstructionInput = z.infer<typeof CreateMeditationInstructionSchema>;
type UpdateMeditationInstructionInput = z.infer<typeof UpdateMeditationInstructionSchema>;
type GetMeditationInstructionsInput = z.infer<typeof GetMeditationInstructionsSchema>;
type GetSingleMeditationInstructionInput = z.infer<typeof GetSingleMeditationInstructionSchema>;
type GetInstructionsByResourceInput = z.infer<typeof GetInstructionsByResourceSchema>;

export class MeditationAdminService {
  private repository: MeditationRepository;

  constructor() {
    this.repository = new MeditationRepository(prisma);
  }
  // ====================================
  //        MEDITATION RESOURCE METHODS
  // ====================================

  async createMeditationResource(data: CreateMeditationResourceInput & { schoolId?: string; createdBy: string }) {
    try {
      const meditation = await this.repository.createMeditationResource(data);

      return {
        success: true,
        data: meditation,
        message: "Meditation resource created successfully"
      };
    } catch (error) {
      console.error("Error creating meditation resource:", error);
      return {
        success: false,
        message: "Failed to create meditation resource",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async getMeditationResources(data: GetMeditationResourcesInput & { schoolId?: string }) {
    try {
      const { meditations, total } = await this.repository.getMeditationResources(data);

      return {
        success: true,
        data: meditations,
        pagination: {
          page: data.page,
          limit: data.limit,
          total,
          totalPages: Math.ceil(total / data.limit)
        }
      };
    } catch (error) {
      console.error("Error fetching meditation resources:", error);
      return {
        success: false,
        message: "Failed to fetch meditation resources",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async getMeditationResourceById(data: GetSingleMeditationResourceInput) {
    try {
      const meditation = await this.repository.getMeditationResourceById(data.id);

      if (!meditation) {
        return {
          success: false,
          message: "Meditation resource not found"
        };
      }

      return {
        success: true,
        data: meditation
      };
    } catch (error) {
      console.error("Error fetching meditation resource:", error);
      return {
        success: false,
        message: "Failed to fetch meditation resource",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async updateMeditationResource(data: UpdateMeditationResourceInput & { id: string; schoolId?: string }) {
    try {
      const meditation = await this.repository.updateMeditationResource(data.id, data);

      return {
        success: true,
        data: meditation,
        message: "Meditation resource updated successfully"
      };
    } catch (error) {
      console.error("Error updating meditation resource:", error);
      return {
        success: false,
        message: "Failed to update meditation resource",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async deleteMeditationResource(data: GetSingleMeditationResourceInput) {
    try {
      await this.repository.deleteMeditationResource(data.id);

      return {
        success: true,
        message: "Meditation resource deleted successfully"
      };
    } catch (error) {
      console.error("Error deleting meditation resource:", error);
      return {
        success: false,
        message: "Failed to delete meditation resource",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  // ====================================
  //        MEDITATION CATEGORY METHODS
  // ====================================

  async createMeditationCategory(data: CreateMeditationCategoryInput) {
    try {
      const category = await this.repository.createMeditationCategory(data);

      return {
        success: true,
        data: category,
        message: "Meditation category created successfully"
      };
    } catch (error) {
      console.error("Error creating meditation category:", error);
      return {
        success: false,
        message: "Failed to create meditation category",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async getMeditationCategories(data: GetMeditationCategoriesInput) {
    try {
      const { categories, total } = await this.repository.getMeditationCategories(data);

      return {
        success: true,
        data: categories,
        pagination: {
          page: data.page,
          limit: data.limit,
          total,
          totalPages: Math.ceil(total / data.limit)
        }
      };
    } catch (error) {
      console.error("Error fetching meditation categories:", error);
      return {
        success: false,
        message: "Failed to fetch meditation categories",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async getMeditationCategoryById(data: GetSingleMeditationCategoryInput) {
    try {
      const category = await this.repository.getMeditationCategoryById(data.id);

      if (!category) {
        return {
          success: false,
          message: "Meditation category not found"
        };
      }

      return {
        success: true,
        data: category
      };
    } catch (error) {
      console.error("Error fetching meditation category:", error);
      return {
        success: false,
        message: "Failed to fetch meditation category",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async updateMeditationCategory(data: UpdateMeditationCategoryInput & { id: string }) {
    try {
      const category = await this.repository.updateMeditationCategory(data.id, data);

      return {
        success: true,
        data: category,
        message: "Meditation category updated successfully"
      };
    } catch (error) {
      console.error("Error updating meditation category:", error);
      return {
        success: false,
        message: "Failed to update meditation category",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async deleteMeditationCategory(data: GetSingleMeditationCategoryInput) {
    try {
      await this.repository.deleteMeditationCategory(data.id);

      return {
        success: true,
        message: "Meditation category deleted successfully"
      };
    } catch (error) {
      console.error("Error deleting meditation category:", error);
      return {
        success: false,
        message: "Failed to delete meditation category",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  // ====================================
  //           MEDITATION GOAL METHODS
  // ====================================

  async createMeditationGoal(data: CreateMeditationGoalInput) {
    try {
      const goal = await prisma.meditationGoal.create({
        data
      });

      return {
        success: true,
        data: goal,
        message: "Meditation goal created successfully"
      };
    } catch (error) {
      console.error("Error creating meditation goal:", error);
      return {
        success: false,
        message: "Failed to create meditation goal",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async getMeditationGoals(data: GetMeditationGoalsInput) {
    try {
      const { page, limit, search, status } = data;
      const skip = (page - 1) * limit;

      const where: any = {
        ...(status && { status }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } }
          ]
        })
      };

      const [goals, total] = await Promise.all([
        prisma.meditationGoal.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: "desc"
          }
        }),
        prisma.meditationGoal.count({ where })
      ]);

      return {
        success: true,
        data: goals,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error("Error fetching meditation goals:", error);
      return {
        success: false,
        message: "Failed to fetch meditation goals",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async getMeditationGoalById(data: GetSingleMeditationGoalInput) {
    try {
      const goal = await prisma.meditationGoal.findUnique({
        where: { id: data.id }
      });

      if (!goal) {
        return {
          success: false,
          message: "Meditation goal not found"
        };
      }

      return {
        success: true,
        data: goal
      };
    } catch (error) {
      console.error("Error fetching meditation goal:", error);
      return {
        success: false,
        message: "Failed to fetch meditation goal",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async updateMeditationGoal(data: UpdateMeditationGoalInput & { id: string }) {
    try {
      const goal = await prisma.meditationGoal.update({
        where: { id: data.id },
        data
      });

      return {
        success: true,
        data: goal,
        message: "Meditation goal updated successfully"
      };
    } catch (error) {
      console.error("Error updating meditation goal:", error);
      return {
        success: false,
        message: "Failed to update meditation goal",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async deleteMeditationGoal(data: GetSingleMeditationGoalInput) {
    try {
      await prisma.meditationGoal.delete({
        where: { id: data.id }
      });

      return {
        success: true,
        message: "Meditation goal deleted successfully"
      };
    } catch (error) {
      console.error("Error deleting meditation goal:", error);
      return {
        success: false,
        message: "Failed to delete meditation goal",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  // ====================================
  //     MEDITATION INSTRUCTION METHODS
  // ====================================

  async createMeditationInstruction(data: CreateMeditationInstructionInput & { schoolId?: string; createdBy?: string }) {
    try {
      // Only include createdBy if it's provided and valid
      const createData: any = {
        title: data.title,
        description: data.description,
        steps: data.steps,
        duration: data.duration,
        difficulty: data.difficulty,
        status: data.status,
        resourceId: data.resourceId,
        proTip: data.proTip,
        schoolId: data.schoolId
      };

      // Skip createdBy entirely for now to avoid foreign key constraint
      // if (data.createdBy && data.createdBy !== 'admin_user_id') {
      //   createData.createdBy = data.createdBy;
      // }

      const instruction = await prisma.meditationListeningInstruction.create({
        data: createData
      });

      return {
        success: true,
        data: instruction,
        message: "Meditation instruction created successfully"
      };
    } catch (error) {
      console.error("Error creating meditation instruction:", error);
      return {
        success: false,
        message: "Failed to create meditation instruction",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async getMeditationInstructions(data: GetMeditationInstructionsInput & { schoolId?: string }) {
    try {
      const { page, limit, search, status, difficulty, schoolId } = data;
      const skip = (page - 1) * limit;

      const where: any = {
        ...(schoolId && { schoolId }),
        ...(status && { status }),
        ...(difficulty && { difficulty }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } }
          ]
        })
      };

      const [instructions, total] = await Promise.all([
        prisma.meditationListeningInstruction.findMany({
          where,
          skip,
          take: limit,
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        }),
        prisma.meditationListeningInstruction.count({ where })
      ]);

      return {
        success: true,
        data: instructions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error("Error fetching meditation instructions:", error);
      return {
        success: false,
        message: "Failed to fetch meditation instructions",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async getMeditationInstructionById(data: GetSingleMeditationInstructionInput) {
    try {
      const instruction = await prisma.meditationListeningInstruction.findUnique({
        where: { id: data.id },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!instruction) {
        return {
          success: false,
          message: "Meditation instruction not found"
        };
      }

      return {
        success: true,
        data: instruction
      };
    } catch (error) {
      console.error("Error fetching meditation instruction:", error);
      return {
        success: false,
        message: "Failed to fetch meditation instruction",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async updateMeditationInstruction(data: UpdateMeditationInstructionInput & { id: string }) {
    try {
      const instruction = await prisma.meditationListeningInstruction.update({
        where: { id: data.id },
        data
      });

      return {
        success: true,
        data: instruction,
        message: "Meditation instruction updated successfully"
      };
    } catch (error) {
      console.error("Error updating meditation instruction:", error);
      return {
        success: false,
        message: "Failed to update meditation instruction",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async deleteMeditationInstruction(data: GetSingleMeditationInstructionInput) {
    try {
      await prisma.meditationListeningInstruction.delete({
        where: { id: data.id }
      });

      return {
        success: true,
        message: "Meditation instruction deleted successfully"
      };
    } catch (error) {
      console.error("Error deleting meditation instruction:", error);
      return {
        success: false,
        message: "Failed to delete meditation instruction",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async deleteAllMeditationInstructions() {
    try {
      await prisma.meditationListeningInstruction.deleteMany({});

      return {
        success: true,
        message: "All meditation instructions deleted successfully"
      };
    } catch (error) {
      console.error("Error deleting all meditation instructions:", error);
      return {
        success: false,
        message: "Failed to delete all meditation instructions",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async getInstructionsByResource(data: GetInstructionsByResourceInput) {
    try {
      const instructions = await prisma.meditationListeningInstruction.findMany({
        where: { resourceId: data.resourceId },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      });

      return {
        success: true,
        data: instructions
      };
    } catch (error) {
      console.error("Error fetching instructions by resource:", error);
      return {
        success: false,
        message: "Failed to fetch instructions by resource",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
}