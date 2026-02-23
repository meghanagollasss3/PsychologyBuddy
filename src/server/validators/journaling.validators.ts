import { z } from 'zod';

// Writing Journal Validators
export const CreateWritingJournalSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
});

export const DeleteWritingJournalSchema = z.object({
  id: z.string().min(1, 'Journal ID is required'),
});

// Audio Journal Validators
export const CreateAudioJournalSchema = z.object({
  title: z.string().optional(),
  audioUrl: z.string().url('Invalid audio URL'),
  duration: z.number().min(1, 'Duration must be greater than 0'),
});

export const DeleteAudioJournalSchema = z.object({
  id: z.string().min(1, 'Journal ID is required'),
});

// Art Journal Validators
export const CreateArtJournalSchema = z.object({
  imageUrl: z.string().url('Invalid image URL'),
});

export const DeleteArtJournalSchema = z.object({
  id: z.string().min(1, 'Journal ID is required'),
});

// Admin Config Validators
export const UpdateJournalingConfigSchema = z.object({
  enableWriting: z.boolean().optional(),
  enableAudio: z.boolean().optional(),
  enableArt: z.boolean().optional(),
  maxAudioDuration: z.number().min(1).max(600).optional(), // Max 10 minutes
  autoSaveAudio: z.boolean().optional(),
  enableUndo: z.boolean().optional(),
  enableRedo: z.boolean().optional(),
  enableClearCanvas: z.boolean().optional(),
  // enableColorPalette: z.boolean().optional(), // Field doesn't exist in database schema
  schoolId: z.string().optional(),
});

// Admin Prompt Validators
export const CreateJournalingPromptSchema = z.object({
  text: z.string().min(1, 'Prompt text is required'),
  moodIds: z.array(z.string()).optional(),
  journalTypes: z.array(z.enum(['writing', 'art'])).optional(),
  isEnabled: z.boolean().optional(),
  schoolId: z.string().optional(),
});

export const UpdateJournalingPromptSchema = z.object({
  text: z.string().min(1, 'Prompt text is required').optional(),
  moodIds: z.array(z.string()).min(1, 'At least one mood ID is required').optional(),
  isEnabled: z.boolean().optional(),
  schoolId: z.string().optional(),
});

export const DeleteJournalingPromptSchema = z.object({
  id: z.string().min(1, 'Prompt ID is required'),
});

export const GetJournalingConfigSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
});

// Type exports
export type CreateWritingJournalInput = z.infer<typeof CreateWritingJournalSchema>;
export type DeleteWritingJournalInput = z.infer<typeof DeleteWritingJournalSchema>;
export type CreateAudioJournalInput = z.infer<typeof CreateAudioJournalSchema>;
export type DeleteAudioJournalInput = z.infer<typeof DeleteAudioJournalSchema>;
export type CreateArtJournalInput = z.infer<typeof CreateArtJournalSchema>;
export type DeleteArtJournalInput = z.infer<typeof DeleteArtJournalSchema>;
export type UpdateJournalingConfigInput = z.infer<typeof UpdateJournalingConfigSchema>;
export type CreateJournalingPromptInput = z.infer<typeof CreateJournalingPromptSchema>;
export type UpdateJournalingPromptInput = z.infer<typeof UpdateJournalingPromptSchema>;
export type DeleteJournalingPromptInput = z.infer<typeof DeleteJournalingPromptSchema>;
export type GetJournalingConfigInput = z.infer<typeof GetJournalingConfigSchema>;
