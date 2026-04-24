import { z } from "zod";

// ====================================
//        MUSIC RESOURCE SCHEMAS
// ====================================

export const CreateMusicResourceSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().optional(),
  url: z.string().min(1, "Audio URL is required").refine((url) => {
    // Accept absolute URLs (http/https), relative URLs (starting with /), and data URLs
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:');
  }, "Invalid audio URL format"),
  duration: z.number().int().positive("Duration must be positive").optional(),
  artist: z.string().optional(),
  album: z.string().optional(),
  coverImage: z.string().url("Invalid cover image URL").optional().or(z.literal("")),
  thumbnailUrl: z.string().url("Invalid thumbnail URL").optional(),
  isPublic: z.boolean().default(true),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  categoryIds: z.array(z.string()).optional(),
  goalIds: z.array(z.string()).optional(),
});

export const UpdateMusicResourceSchema = CreateMusicResourceSchema.partial();

export const GetMusicResourcesSchema = z.object({
  category: z.string().optional(),
  goal: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const GetSingleMusicResourceSchema = z.object({
  id: z.string().min(1, "Music resource ID is required"),
});

// ====================================
//        MUSIC CATEGORY SCHEMAS
// ====================================

export const CreateMusicCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100, "Name too long"),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const UpdateMusicCategorySchema = CreateMusicCategorySchema.partial();

export const GetMusicCategoriesSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const GetSingleMusicCategorySchema = z.object({
  id: z.string().min(1, "Category ID is required"),
});

// ====================================
//           MUSIC GOAL SCHEMAS
// ====================================

export const CreateMusicGoalSchema = z.object({
  name: z.string().min(1, "Goal name is required").max(100, "Name too long"),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const UpdateMusicGoalSchema = CreateMusicGoalSchema.partial();

export const GetMusicGoalsSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const GetSingleMusicGoalSchema = z.object({
  id: z.string().min(1, "Goal ID is required"),
});

// ====================================
//      MUSIC INSTRUCTION SCHEMAS
// ====================================

export const InstructionStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  title: z.string().min(1, "Step title is required"),
  description: z.string().min(1, "Step description is required"),
  duration: z.number().int().positive("Duration must be positive").optional(),
});

export const CreateMusicInstructionSchema = z.object({
  title: z.string().min(1, "Instruction title is required").max(200, "Title too long"),
  description: z.string().min(1, "Description is required"),
  steps: z.array(InstructionStepSchema).min(1, "At least one step is required"),
  duration: z.number().int().positive("Duration must be positive").optional(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  resourceId: z.string().optional(),
  proTip: z.string().optional().nullable(),
});

export const UpdateMusicInstructionSchema = CreateMusicInstructionSchema.partial();

export const GetMusicInstructionsSchema = z.object({
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const GetSingleMusicInstructionSchema = z.object({
  id: z.string().min(1, "Instruction ID is required"),
});

export const GetInstructionsByResourceSchema = z.object({
  resourceId: z.string().min(1, "Resource ID is required"),
});

// ====================================
//        STUDENT ACCESS SCHEMAS
// ====================================

export const StudentGetMusicResourcesSchema = z.object({
  category: z.string().optional(),
  goal: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const StudentGetFeaturedMusicSchema = z.object({
  limit: z.coerce.number().int().positive().max(20).default(10),
});

export const StudentGetMusicInstructionsSchema = z.object({
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

// ====================================
//           TYPE EXPORTS
// ====================================

export type CreateMusicResourceInput = z.infer<typeof CreateMusicResourceSchema>;
export type UpdateMusicResourceInput = z.infer<typeof UpdateMusicResourceSchema>;
export type GetMusicResourcesInput = z.infer<typeof GetMusicResourcesSchema>;
export type GetSingleMusicResourceInput = z.infer<typeof GetSingleMusicResourceSchema>;

export type CreateMusicCategoryInput = z.infer<typeof CreateMusicCategorySchema>;
export type UpdateMusicCategoryInput = z.infer<typeof UpdateMusicCategorySchema>;
export type GetMusicCategoriesInput = z.infer<typeof GetMusicCategoriesSchema>;
export type GetSingleMusicCategoryInput = z.infer<typeof GetSingleMusicCategorySchema>;

export type CreateMusicGoalInput = z.infer<typeof CreateMusicGoalSchema>;
export type UpdateMusicGoalInput = z.infer<typeof UpdateMusicGoalSchema>;
export type GetMusicGoalsInput = z.infer<typeof GetMusicGoalsSchema>;
export type GetSingleMusicGoalInput = z.infer<typeof GetSingleMusicGoalSchema>;

export type CreateMusicInstructionInput = z.infer<typeof CreateMusicInstructionSchema>;
export type UpdateMusicInstructionInput = z.infer<typeof UpdateMusicInstructionSchema>;
export type GetMusicInstructionsInput = z.infer<typeof GetMusicInstructionsSchema>;
export type GetSingleMusicInstructionInput = z.infer<typeof GetSingleMusicInstructionSchema>;
export type GetInstructionsByResourceInput = z.infer<typeof GetInstructionsByResourceSchema>;

export type StudentGetMusicResourcesInput = z.infer<typeof StudentGetMusicResourcesSchema>;
export type StudentGetFeaturedMusicInput = z.infer<typeof StudentGetFeaturedMusicSchema>;
export type StudentGetMusicInstructionsInput = z.infer<typeof StudentGetMusicInstructionsSchema>;