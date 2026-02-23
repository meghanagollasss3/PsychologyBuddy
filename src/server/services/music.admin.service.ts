import { MusicRepository } from "../repository/music.repository";
import prisma from "@/src/prisma";
import {
  CreateMusicResourceInput,
  UpdateMusicResourceInput,
  GetMusicResourcesInput,
  GetSingleMusicResourceInput,
  CreateMusicCategoryInput,
  UpdateMusicCategoryInput,
  GetMusicCategoriesInput,
  GetSingleMusicCategoryInput,
  CreateMusicGoalInput,
  UpdateMusicGoalInput,
  GetMusicGoalsInput,
  GetSingleMusicGoalInput,
  CreateMusicInstructionInput,
  UpdateMusicInstructionInput,
  GetMusicInstructionsInput,
  GetSingleMusicInstructionInput,
  GetInstructionsByResourceInput,
} from "../validators/music.validators";

export class MusicAdminService {
  private musicRepository: MusicRepository;

  constructor() {
    this.musicRepository = new MusicRepository(prisma);
  }

  // ====================================
  //        MUSIC RESOURCE MANAGEMENT
  // ====================================

  async createMusicResource(data: CreateMusicResourceInput & { schoolId?: string }) {
    try {
      const resource = await this.musicRepository.createMusicResource(data);
      
      return {
        success: true,
        message: "Music resource created successfully",
        data: resource,
      };
    } catch (error) {
      console.error("Error creating music resource:", error);
      console.error("Error details:", {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      return {
        success: false,
        message: "Failed to create music resource",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getMusicResources(data: GetMusicResourcesInput & { schoolId?: string }) {
    try {
      const result = await this.musicRepository.getMusicResources(data);
      
      return {
        success: true,
        message: "Music resources retrieved successfully",
        data: result,
      };
    } catch (error) {
      console.error("Error getting music resources:", error);
      return {
        success: false,
        message: "Failed to retrieve music resources",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getMusicResourceById(data: GetSingleMusicResourceInput) {
    try {
      const resource = await this.musicRepository.getMusicResourceById(data.id);
      
      if (!resource) {
        return {
          success: false,
          message: "Music resource not found",
        };
      }

      return {
        success: true,
        message: "Music resource retrieved successfully",
        data: resource,
      };
    } catch (error) {
      console.error("Error getting music resource:", error);
      return {
        success: false,
        message: "Failed to retrieve music resource",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async updateMusicResource(data: UpdateMusicResourceInput & { id: string; schoolId?: string }) {
    try {
      const existingResource = await this.musicRepository.getMusicResourceById(data.id);
      
      if (!existingResource) {
        return {
          success: false,
          message: "Music resource not found",
        };
      }

      const { id, schoolId, ...updateData } = data;
      
      // Only include schoolId if it's valid (not null and not placeholder)
      const finalUpdateData: any = { ...updateData };
      if (schoolId && schoolId !== "school_id") {
        finalUpdateData.schoolId = schoolId;
      }
      
      const updatedResource = await this.musicRepository.updateMusicResource(id, finalUpdateData);
      
      return {
        success: true,
        message: "Music resource updated successfully",
        data: updatedResource,
      };
    } catch (error) {
      console.error("Error updating music resource:", error);
      return {
        success: false,
        message: "Failed to update music resource",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async deleteMusicResource(data: GetSingleMusicResourceInput) {
    try {
      const existingResource = await this.musicRepository.getMusicResourceById(data.id);
      
      if (!existingResource) {
        return {
          success: false,
          message: "Music resource not found",
        };
      }

      await this.musicRepository.deleteMusicResource(data.id);
      
      return {
        success: true,
        message: "Music resource deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting music resource:", error);
      return {
        success: false,
        message: "Failed to delete music resource",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ====================================
  //        MUSIC CATEGORY MANAGEMENT
  // ====================================

  async createMusicCategory(data: CreateMusicCategoryInput) {
    try {
      const category = await this.musicRepository.createMusicCategory(data);
      
      return {
        success: true,
        message: "Music category created successfully",
        data: category,
      };
    } catch (error) {
      console.error("Error creating music category:", error);
      
      if (error instanceof Error && error.message.includes("Unique constraint")) {
        return {
          success: false,
          message: "Category name already exists",
        };
      }

      return {
        success: false,
        message: "Failed to create music category",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getMusicCategories(data: GetMusicCategoriesInput = {}) {
    try {
      const categories = await this.musicRepository.getMusicCategories(data);
      
      return {
        success: true,
        message: "Music categories retrieved successfully",
        data: categories,
      };
    } catch (error) {
      console.error("Error getting music categories:", error);
      return {
        success: false,
        message: "Failed to retrieve music categories",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getMusicCategoryById(data: GetSingleMusicCategoryInput) {
    try {
      const category = await this.musicRepository.getMusicCategoryById(data.id);
      
      if (!category) {
        return {
          success: false,
          message: "Music category not found",
        };
      }

      return {
        success: true,
        message: "Music category retrieved successfully",
        data: category,
      };
    } catch (error) {
      console.error("Error getting music category:", error);
      return {
        success: false,
        message: "Failed to retrieve music category",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async updateMusicCategory(data: UpdateMusicCategoryInput & { id: string }) {
    try {
      const existingCategory = await this.musicRepository.getMusicCategoryById(data.id);
      
      if (!existingCategory) {
        return {
          success: false,
          message: "Music category not found",
        };
      }

      const { id, ...updateData } = data;
      const updatedCategory = await this.musicRepository.updateMusicCategory(id, updateData);
      
      return {
        success: true,
        message: "Music category updated successfully",
        data: updatedCategory,
      };
    } catch (error) {
      console.error("Error updating music category:", error);
      
      if (error instanceof Error && error.message.includes("Unique constraint")) {
        return {
          success: false,
          message: "Category name already exists",
        };
      }

      return {
        success: false,
        message: "Failed to update music category",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async deleteMusicCategory(data: GetSingleMusicCategoryInput) {
    try {
      const existingCategory = await this.musicRepository.getMusicCategoryById(data.id);
      
      if (!existingCategory) {
        return {
          success: false,
          message: "Music category not found",
        };
      }

      // Check if category is being used by any music resources
      if (existingCategory.musicResources.length > 0) {
        return {
          success: false,
          message: "Cannot delete category: it is being used by music resources",
        };
      }

      await this.musicRepository.deleteMusicCategory(data.id);
      
      return {
        success: true,
        message: "Music category deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting music category:", error);
      return {
        success: false,
        message: "Failed to delete music category",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ====================================
  //           MUSIC GOAL MANAGEMENT
  // ====================================

  async createMusicGoal(data: CreateMusicGoalInput) {
    try {
      const goal = await this.musicRepository.createMusicGoal(data);
      
      return {
        success: true,
        message: "Music goal created successfully",
        data: goal,
      };
    } catch (error) {
      console.error("Error creating music goal:", error);
      
      if (error instanceof Error && error.message.includes("Unique constraint")) {
        return {
          success: false,
          message: "Goal name already exists",
        };
      }

      return {
        success: false,
        message: "Failed to create music goal",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getMusicGoals(data: GetMusicGoalsInput = {}) {
    try {
      const goals = await this.musicRepository.getMusicGoals(data);
      
      return {
        success: true,
        message: "Music goals retrieved successfully",
        data: goals,
      };
    } catch (error) {
      console.error("Error getting music goals:", error);
      return {
        success: false,
        message: "Failed to retrieve music goals",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getMusicGoalById(data: GetSingleMusicGoalInput) {
    try {
      const goal = await this.musicRepository.getMusicGoalById(data.id);
      
      if (!goal) {
        return {
          success: false,
          message: "Music goal not found",
        };
      }

      return {
        success: true,
        message: "Music goal retrieved successfully",
        data: goal,
      };
    } catch (error) {
      console.error("Error getting music goal:", error);
      return {
        success: false,
        message: "Failed to retrieve music goal",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async updateMusicGoal(data: UpdateMusicGoalInput & { id: string }) {
    try {
      const existingGoal = await this.musicRepository.getMusicGoalById(data.id);
      
      if (!existingGoal) {
        return {
          success: false,
          message: "Music goal not found",
        };
      }

      const { id, ...updateData } = data;
      const updatedGoal = await this.musicRepository.updateMusicGoal(id, updateData);
      
      return {
        success: true,
        message: "Music goal updated successfully",
        data: updatedGoal,
      };
    } catch (error) {
      console.error("Error updating music goal:", error);
      
      if (error instanceof Error && error.message.includes("Unique constraint")) {
        return {
          success: false,
          message: "Goal name already exists",
        };
      }

      return {
        success: false,
        message: "Failed to update music goal",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async deleteMusicGoal(data: GetSingleMusicGoalInput) {
    try {
      const existingGoal = await this.musicRepository.getMusicGoalById(data.id);
      
      if (!existingGoal) {
        return {
          success: false,
          message: "Music goal not found",
        };
      }

      // Check if goal is being used by any music resources
      if (existingGoal.musicResources.length > 0) {
        return {
          success: false,
          message: "Cannot delete goal: it is being used by music resources",
        };
      }

      await this.musicRepository.deleteMusicGoal(data.id);
      
      return {
        success: true,
        message: "Music goal deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting music goal:", error);
      return {
        success: false,
        message: "Failed to delete music goal",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ====================================
  //      MUSIC INSTRUCTION MANAGEMENT
  // ====================================

  async createMusicInstruction(data: CreateMusicInstructionInput & { schoolId?: string; createdBy?: string }) {
    try {
      // Handle createdBy constraint - only include if valid
      const { createdBy, ...createData } = data;
      
      const finalData = {
        ...createData,
        // Only include createdBy if it's not the default placeholder
        ...(createdBy && createdBy !== 'admin@calmpath.ai' && { createdBy })
      };

      const instruction = await this.musicRepository.createMusicInstruction(finalData);
      
      return {
        success: true,
        message: "Music instruction created successfully",
        data: instruction,
      };
    } catch (error) {
      console.error("Error creating music instruction:", error);
      return {
        success: false,
        message: "Failed to create music instruction",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getMusicInstructions(data: GetMusicInstructionsInput & { schoolId?: string }) {
    try {
      const result = await this.musicRepository.getMusicInstructions(data);
      
      return {
        success: true,
        message: "Music instructions retrieved successfully",
        data: result.instructions, // Return only the instructions array
      };
    } catch (error) {
      console.error("Error getting music instructions:", error);
      return {
        success: false,
        message: "Failed to retrieve music instructions",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getMusicInstructionById(data: GetSingleMusicInstructionInput) {
    try {
      const instruction = await this.musicRepository.getMusicInstructionById(data.id);
      
      if (!instruction) {
        return {
          success: false,
          message: "Music instruction not found",
        };
      }

      return {
        success: true,
        message: "Music instruction retrieved successfully",
        data: instruction,
      };
    } catch (error) {
      console.error("Error getting music instruction:", error);
      return {
        success: false,
        message: "Failed to retrieve music instruction",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async updateMusicInstruction(data: UpdateMusicInstructionInput & { id: string }) {
    try {
      const existingInstruction = await this.musicRepository.getMusicInstructionById(data.id);
      
      if (!existingInstruction) {
        return {
          success: false,
          message: "Music instruction not found",
        };
      }

      const { id, ...updateData } = data;
      const updatedInstruction = await this.musicRepository.updateMusicInstruction(id, updateData);
      
      return {
        success: true,
        message: "Music instruction updated successfully",
        data: updatedInstruction,
      };
    } catch (error) {
      console.error("Error updating music instruction:", error);
      return {
        success: false,
        message: "Failed to update music instruction",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async deleteMusicInstruction(data: GetSingleMusicInstructionInput) {
    try {
      const existingInstruction = await this.musicRepository.getMusicInstructionById(data.id);
      
      if (!existingInstruction) {
        return {
          success: false,
          message: "Music instruction not found",
        };
      }

      await this.musicRepository.deleteMusicInstruction(data.id);
      
      return {
        success: true,
        message: "Music instruction deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting music instruction:", error);
      return {
        success: false,
        message: "Failed to delete music instruction",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async deleteAllMusicInstructions() {
    try {
      await this.musicRepository.deleteAllMusicInstructions();

      return {
        success: true,
        message: "All music instructions deleted successfully"
      };
    } catch (error) {
      console.error("Error deleting all music instructions:", error);
      return {
        success: false,
        message: "Failed to delete all music instructions",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async getInstructionsByResource(data: GetInstructionsByResourceInput & { page?: number; limit?: number }) {
    try {
      const result = await this.musicRepository.getInstructionsByResource(data.resourceId, {
        page: data.page,
        limit: data.limit,
      });
      
      return {
        success: true,
        message: "Instructions by resource retrieved successfully",
        data: result,
      };
    } catch (error) {
      console.error("Error getting instructions by resource:", error);
      return {
        success: false,
        message: "Failed to retrieve instructions by resource",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
