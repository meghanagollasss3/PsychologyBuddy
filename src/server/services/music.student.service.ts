import { MusicRepository } from "../repository/music.repository";
import prisma from "@/src/prisma";
import {
  StudentGetMusicResourcesInput,
  StudentGetFeaturedMusicInput,
  StudentGetMusicInstructionsInput,
  GetSingleMusicResourceInput,
  GetSingleMusicInstructionInput,
} from "../validators/music.validators";

export class MusicStudentService {
  private musicRepository: MusicRepository;

  constructor() {
    this.musicRepository = new MusicRepository(prisma);
  }

  // ====================================
  //        MUSIC RESOURCE ACCESS
  // ====================================

  async getMusicResources(data: StudentGetMusicResourcesInput & { schoolId?: string }) {
    try {
      console.log('Student service getMusicResources - input data:', data);
      const result = await this.musicRepository.getMusicResources(data);
      console.log('Student service getMusicResources - repository result:', result);
      
      return {
        success: true,
        message: "Music resources retrieved successfully",
        data: {
          resources: result.resources,
          pagination: result.pagination
        },
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
      const resource = await this.musicRepository.getPublishedMusicResourceById(data.id);
      
      if (!resource) {
        return {
          success: false,
          message: "Music resource not found or not available",
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

  async getMusicByCategory(data: { category: string; goal?: string; page?: number; limit?: number; schoolId?: string }) {
    try {
      const result = await this.musicRepository.getPublishedMusicResources({
        category: data.category,
        goal: data.goal,
        page: data.page || 1,
        limit: data.limit || 20,
        schoolId: data.schoolId,
      });
      
      return {
        success: true,
        message: `Music resources in category '${data.category}' retrieved successfully`,
        data: result,
      };
    } catch (error) {
      console.error("Error getting music by category:", error);
      return {
        success: false,
        message: "Failed to retrieve music by category",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getMusicByGoal(data: { goal: string; category?: string; page?: number; limit?: number; schoolId?: string }) {
    try {
      const result = await this.musicRepository.getPublishedMusicResources({
        goal: data.goal,
        category: data.category,
        page: data.page || 1,
        limit: data.limit || 20,
        schoolId: data.schoolId,
      });
      
      return {
        success: true,
        message: `Music resources for goal '${data.goal}' retrieved successfully`,
        data: result,
      };
    } catch (error) {
      console.error("Error getting music by goal:", error);
      return {
        success: false,
        message: "Failed to retrieve music by goal",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getFeaturedMusic(data: StudentGetFeaturedMusicInput & { schoolId?: string }) {
    try {
      const resources = await this.musicRepository.getFeaturedMusic(data.limit, data.schoolId);
      
      return {
        success: true,
        message: "Featured music retrieved successfully",
        data: resources,
      };
    } catch (error) {
      console.error("Error getting featured music:", error);
      return {
        success: false,
        message: "Failed to retrieve featured music",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ====================================
  //      MUSIC INSTRUCTION ACCESS
  // ====================================

  async getMusicInstructions(data: StudentGetMusicInstructionsInput & { schoolId?: string }) {
    try {
      const result = await this.musicRepository.getPublishedMusicInstructions(data);
      
      return {
        success: true,
        message: "Music instructions retrieved successfully",
        data: result,
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
      const instruction = await this.musicRepository.getPublishedMusicInstructionById(data.id);
      
      if (!instruction) {
        return {
          success: false,
          message: "Music instruction not found or not available",
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

  async getMusicInstructionsByDifficulty(data: { difficulty: string; page?: number; limit?: number; schoolId?: string }) {
    try {
      const result = await this.musicRepository.getPublishedMusicInstructions({
        difficulty: data.difficulty,
        page: data.page || 1,
        limit: data.limit || 20,
        schoolId: data.schoolId,
      });
      
      return {
        success: true,
        message: `Music instructions for ${data.difficulty} level retrieved successfully`,
        data: result,
      };
    } catch (error) {
      console.error("Error getting music instructions by difficulty:", error);
      return {
        success: false,
        message: "Failed to retrieve music instructions by difficulty",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getMusicInstructionsByResource(data: { resourceId: string; page?: number; limit?: number }) {
    try {
      const result = await this.musicRepository.getPublishedInstructionsByResource(data.resourceId, {
        page: data.page,
        limit: data.limit,
      });
      
      return {
        success: true,
        message: "Music instructions for resource retrieved successfully",
        data: result,
      };
    } catch (error) {
      console.error("Error getting music instructions by resource:", error);
      return {
        success: false,
        message: "Failed to retrieve music instructions by resource",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ====================================
  //        MUSIC DISCOVERY HELPERS
  // ====================================

  async getMusicCategories() {
    try {
      const categories = await this.musicRepository.getMusicCategories({ status: "ACTIVE" });
      
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

  async getMusicGoals() {
    try {
      const goals = await this.musicRepository.getMusicGoals({ status: "ACTIVE" });
      
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

  async searchMusic(data: { query: string; page?: number; limit?: number; schoolId?: string }) {
    try {
      // Search by title, description, artist, or album
      const result = await this.musicRepository.getPublishedMusicResources({
        page: data.page || 1,
        limit: data.limit || 20,
        schoolId: data.schoolId,
      });

      // Filter results based on search query
      const filteredResources = result.resources.filter(resource => 
        resource.title.toLowerCase().includes(data.query.toLowerCase()) ||
        (resource.description && resource.description.toLowerCase().includes(data.query.toLowerCase())) ||
        (resource.artist && resource.artist.toLowerCase().includes(data.query.toLowerCase())) ||
        (resource.album && resource.album.toLowerCase().includes(data.query.toLowerCase()))
      );

      return {
        success: true,
        message: "Music search completed successfully",
        data: {
          resources: filteredResources,
          pagination: {
            page: data.page || 1,
            limit: data.limit || 20,
            total: filteredResources.length,
            totalPages: Math.ceil(filteredResources.length / (data.limit || 20)),
          },
        },
      };
    } catch (error) {
      console.error("Error searching music:", error);
      return {
        success: false,
        message: "Failed to search music",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getRecommendedMusic(data: { limit?: number; schoolId?: string; mood?: string; goal?: string }) {
    try {
      // Get featured music as base recommendations
      const featuredMusic = await this.musicRepository.getFeaturedMusic(data.limit || 10, data.schoolId);
      
      // If mood or goal is specified, filter accordingly
      let recommendations = featuredMusic;
      
      if (data.mood || data.goal) {
        const filteredResult = await this.musicRepository.getPublishedMusicResources({
          category: data.mood,
          goal: data.goal,
          page: 1,
          limit: data.limit || 10,
          schoolId: data.schoolId,
        });
        recommendations = filteredResult.resources;
      }

      return {
        success: true,
        message: "Music recommendations retrieved successfully",
        data: recommendations,
      };
    } catch (error) {
      console.error("Error getting music recommendations:", error);
      return {
        success: false,
        message: "Failed to retrieve music recommendations",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
