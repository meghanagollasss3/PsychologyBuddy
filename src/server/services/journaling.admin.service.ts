import { JournalingAdminRepository } from '@/src/server/repository/journaling.admin.repository';
import { JournalingUtils } from '@/src/utils/journaling.utils';
import { AuthError } from '@/src/utils/errors';
import prisma from '@/src/prisma';
import { 
  UpdateJournalingConfigInput,
  CreateJournalingPromptInput,
  UpdateJournalingPromptInput,
  DeleteJournalingPromptInput,
  GetJournalingConfigInput
} from '../validators/journaling.validators';

export class JournalingAdminService {
  // Journaling Config Management
  static async getJournalingConfig(userId: string, query: GetJournalingConfigInput) {
    try {
      // Verify admin scope
      const admin = await JournalingAdminRepository.getAdminSchool(userId);
      if (!admin) {
        throw new AuthError('Admin user not found', 404);
      }

      // Super admins can access any school or global config
      if (admin.role.name === 'SUPER_ADMIN' || admin.role.name === 'SUPERADMIN') {
        // Allow access to any school or global config
        if (query.schoolId === 'all') {
          // For global config, get the most recently updated config
          // Find the most recently updated school config
          const schools = await JournalingAdminRepository.getAllSchools();
          if (schools.length === 0) {
            // No schools exist, return default config
            return {
              success: true,
              message: 'Global journaling config retrieved successfully',
              data: {
                writingEnabled: true,
                audioEnabled: true,
                artEnabled: true,
                maxAudioDuration: 180,
                autoSaveAudio: true,
                undoRedoEnabled: true,
                enableRedo: true,
                clearCanvasEnabled: true,
                colorPaletteEnabled: true,
              },
            };
          }

          // Get all school configs and find the most recently updated
          const configs = await Promise.all(
            schools.map(school => JournalingAdminRepository.getJournalingConfig(school.id))
          );
          
          // Filter out null configs and use the first one as default
          const validConfigs = configs.filter(config => config !== null);
          const latestConfig = validConfigs.length > 0 ? validConfigs[0] : {
              writingEnabled: true,
              audioEnabled: true,
              artEnabled: true,
              maxAudioDuration: 180,
              autoSaveAudio: true,
              undoRedoEnabled: true,
              enableRedo: true,
              clearCanvasEnabled: true,
              colorPaletteEnabled: true,
            };

          return {
            success: true,
            message: 'Global journaling config retrieved successfully',
            data: latestConfig,
          };
        }
      } else {
        // Regular admins can only access their own school
        if (admin.schoolId !== query.schoolId) {
          throw new AuthError('Access denied. You can only manage your own school.', 403);
        }
      }

      const config = await JournalingUtils.getOrCreateDefaultConfig(query.schoolId);

      return {
        success: true,
        message: 'Journaling config retrieved successfully',
        data: config,
      };
    } catch (error) {
      console.error('Get journaling config error:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        query
      });
      
      // Re-throw original error if it's an AuthError
      if (error instanceof AuthError) {
        throw error;
      }
      
      // Otherwise throw a generic error
      throw new AuthError('Failed to retrieve journaling config', 500);
    }
  }

  static async updateJournalingConfig(userId: string, data: UpdateJournalingConfigInput) {
    try {
      // Verify admin scope
      const admin = await JournalingAdminRepository.getAdminSchool(userId);
      if (!admin) {
        throw new AuthError('Admin user not found', 404);
      }

      let schoolId = admin.schoolId;
      let isGlobalUpdate = false;
      
      // For super admins, handle both global and specific school updates
      if (admin.role.name === 'SUPER_ADMIN' || admin.role.name === 'SUPERADMIN') {
        if (data.schoolId === 'all') {
          // Global update - apply to all schools
          isGlobalUpdate = true;
        } else if (data.schoolId) {
          // Specific school update
          schoolId = data.schoolId;
        } else {
          // Super admins must specify either 'all' or a specific schoolId
          throw new AuthError('Super admins must specify a schoolId or "all" to manage journaling configuration.', 400);
        }
      }
      
      if (!schoolId && !isGlobalUpdate) {
        // Only non-super admins need a school association
        throw new AuthError('Your admin account is not associated with a school. Please contact system administrator.', 400);
      }

      // Remove schoolId from data before updating config (it's not a config field)
      const { schoolId: _, ...configData } = data;

      let result;
      if (isGlobalUpdate) {
        // Get all schools and update each one
        const schools = await JournalingAdminRepository.getAllSchools();
        console.log('Global update: updating', schools.length, 'schools with config:', configData);
        
        const updatePromises = schools.map(school => 
          JournalingAdminRepository.updateJournalingConfig(school.id, configData)
        );
        result = await Promise.all(updatePromises);
        
        console.log('Global update completed. Results:', result);
      } else {
        // Update specific school
        if (schoolId) {
          console.log('Specific school update for', schoolId, 'with config:', configData);
          result = await JournalingAdminRepository.updateJournalingConfig(schoolId, configData);
          console.log('Specific school update completed. Result:', result);
        } else {
          throw new AuthError('School ID is required for configuration update.', 400);
        }
      }

      return {
        success: true,
        message: isGlobalUpdate 
          ? 'Journaling config updated successfully for all schools'
          : 'Journaling config updated successfully',
        data: result,
      };
    } catch (error) {
      console.error('Update journaling config error:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        data
      });
      
      if (error instanceof AuthError) {
        throw error;
      }
      
      throw new AuthError('Failed to update journaling config', 500);
    }
  }

  // Journaling Prompts Management
  static async createPrompt(userId: string, data: CreateJournalingPromptInput) {
    try {
      // Verify admin is authorized
      const admin = await JournalingAdminRepository.getAdminSchool(userId);
      if (!admin) {
        throw new AuthError('Admin user not found', 404);
      }

      let prompt;
      
      // Handle global vs specific school prompts
      if ((admin.role.name === 'SUPER_ADMIN' || admin.role.name === 'SUPERADMIN') && data.schoolId === 'all') {
        // Global prompt - create without school association
        prompt = await JournalingAdminRepository.createGlobalPrompt(data.text, data.moodIds || []);
      } else {
        // Regular prompt - create with school association
        prompt = await JournalingAdminRepository.createPrompt(data.text, data.moodIds || []);
      }

      return {
        success: true,
        message: data.schoolId === 'all' 
          ? 'Global journaling prompt created successfully'
          : 'Journaling prompt created successfully',
        data: prompt,
      };
    } catch (error) {
      console.error('Create journaling prompt error:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        data
      });
      
      // Re-throw original error if it's an AuthError
      if (error instanceof AuthError) {
        throw error;
      }
      
      // Otherwise throw a generic error
      throw new AuthError('Failed to create journaling prompt', 500);
    }
  }

  static async getAllPrompts(userId: string, schoolId?: string | null) {
    try {
      // Verify admin is authorized
      const admin = await JournalingAdminRepository.getAdminSchool(userId);
      if (!admin) {
        throw new AuthError('Admin user not found', 404);
      }

      // Journaling prompts are global, so we don't filter by school
      // All admins can see all prompts
      const prompts = await JournalingAdminRepository.getAllPrompts();

      return {
        success: true,
        message: 'Journaling prompts retrieved successfully',
        data: prompts,
      };
    } catch (error) {
      console.error('Get journaling prompts error:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        schoolId
      });
      
      // Re-throw original error if it's an AuthError
      if (error instanceof AuthError) {
        throw error;
      }
      
      // Otherwise throw a generic error
      throw new AuthError('Failed to retrieve journal prompts', 500);
    }
  }

  static async updatePrompt(userId: string, promptId: string, data: UpdateJournalingPromptInput) {
    try {
      // Verify admin is authorized
      const admin = await JournalingAdminRepository.getAdminSchool(userId);
      if (!admin) {
        throw new AuthError('Admin user not found', 404);
      }

      // Check if prompt exists
      const existingPrompt = await JournalingAdminRepository.getPromptById(promptId);
      if (!existingPrompt) {
        throw new AuthError('Prompt not found', 404);
      }

      const prompt = await JournalingAdminRepository.updatePrompt(promptId, data);

      return {
        success: true,
        message: 'Journaling prompt updated successfully',
        data: prompt,
      };
    } catch (error) {
      console.error('Update journaling prompt error:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        promptId,
        data
      });
      
      // Re-throw original error if it's an AuthError
      if (error instanceof AuthError) {
        throw error;
      }
      
      // Otherwise throw a generic error
      throw new AuthError('Failed to update journal prompt', 500);
    }
  }

  static async updatePromptStatus(userId: string, promptId: string, isEnabled: boolean) {
    try {
      // Verify admin is authorized
      const admin = await JournalingAdminRepository.getAdminSchool(userId);
      if (!admin) {
        throw new AuthError('Admin user not found', 404);
      }

      // Check if prompt exists
      const existingPrompt = await JournalingAdminRepository.getPromptById(promptId);
      if (!existingPrompt) {
        throw new AuthError('Prompt not found', 404);
      }

      console.log('Updating prompt status:', { promptId, isEnabled });
      const prompt = await JournalingAdminRepository.updatePromptStatus(promptId, isEnabled);
      console.log('Updated prompt:', prompt);

      return {
        success: true,
        message: `Journal prompt ${isEnabled ? 'enabled' : 'disabled'} successfully`,
        data: prompt,
      };
    } catch (error) {
      console.error('Update journal prompt status error:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        promptId,
        isEnabled
      });
      
      // Re-throw original error if it's an AuthError
      if (error instanceof AuthError) {
        throw error;
      }
      
      // Otherwise throw a generic error
      throw new AuthError('Failed to update journal prompt status', 500);
    }
  }

  static async deletePrompt(userId: string, data: DeleteJournalingPromptInput) {
    try {
      // Verify admin is authorized
      const admin = await JournalingAdminRepository.getAdminSchool(userId);
      if (!admin) {
        throw new AuthError('Admin user not found', 404);
      }

      // Check if prompt exists
      const existingPrompt = await JournalingAdminRepository.getPromptById(data.id);
      if (!existingPrompt) {
        throw new AuthError('Prompt not found', 404);
      }

      await JournalingAdminRepository.deletePrompt(data.id);

      return {
        success: true,
        message: 'Journaling prompt deleted successfully',
        data: null,
      };
    } catch (error) {
      console.error('Delete journaling prompt error:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        data
      });
      
      // Re-throw original error if it's an AuthError
      if (error instanceof AuthError) {
        throw error;
      }
      
      // Otherwise throw a generic error
      throw new AuthError('Failed to delete journaling prompt', 500);
    }
  }
}
