import { prisma } from './prisma';
import { AuthError } from '@/src/utils/errors';
import { CreateArticleData, UpdateArticleData } from './library.validators';

export class LibraryService {
  // Create new article
  static async createArticle(data: CreateArticleData, userId: string, userSchoolId?: string) {
    try {
      const article = await prisma.article.create({
        data: {
          title: data.title,
          author: data.author,
          thumbnailUrl: data.thumbnailUrl || null,
          readTime: data.readTime || null,
          description: data.description,
          status: data.status,
          createdBy: userId,
          schoolId: userSchoolId,
          // Create relations if provided
          ...(data.categoryIds && {
            categories: {
              create: data.categoryIds.map(categoryId => ({
                categoryId,
              })),
            },
          }),
          ...(data.moodIds && {
            moods: {
              create: data.moodIds.map(moodId => ({
                moodId,
              })),
            },
          }),
          ...(data.goalIds && {
            goals: {
              create: data.goalIds.map(goalId => ({
                goalId,
              })),
            },
          }),
        },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          moods: {
            include: {
              mood: true,
            },
          },
          goals: {
            include: {
              goal: true,
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
      });

      return {
        success: true,
        message: 'Article created successfully',
        data: article,
      };
    } catch (error) {
      console.error('Create article error:', error);
      throw new AuthError('Failed to create article', 500);
    }
  }

  // Get all articles
  static async getAllArticles(userSchoolId?: string) {
    try {
      let whereClause: any = {};
      
      // For regular admins: show articles from their school + superadmin articles (null schoolId)
      // For super admins: no filtering (can see all articles)
      if (userSchoolId) {
        whereClause = {
          OR: [
            { schoolId: userSchoolId },  // Articles from their school
            { schoolId: null }           // Superadmin articles
          ]
        };
      }
      
      const articles = await prisma.article.findMany({
        where: whereClause,
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          moods: {
            include: {
              mood: true,
            },
          },
          goals: {
            include: {
              goal: true,
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
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        message: 'Articles retrieved successfully',
        data: articles,
      };
    } catch (error) {
      console.error('Get articles error:', error);
      throw new AuthError('Failed to retrieve articles', 500);
    }
  }

  // Get article by ID
  static async getArticleById(id: string) {
    try {
      const article = await prisma.article.findUnique({
        where: { id },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          moods: {
            include: {
              mood: true,
            },
          },
          goals: {
            include: {
              goal: true,
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
      });

      if (!article) {
        throw AuthError.notFound('Article not found');
      }

      return {
        success: true,
        message: 'Article retrieved successfully',
        data: article,
      };
    } catch (error) {
      console.error('Get article error:', error);
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Failed to retrieve article', 500);
    }
  }

  // Update article
  static async updateArticle(id: string, data: UpdateArticleData) {
    try {
      // First check if article exists
      const existingArticle = await prisma.article.findUnique({
        where: { id },
      });

      if (!existingArticle) {
        throw AuthError.notFound('Article not found');
      }

      // Update article with relations
      const updateData: any = {
        ...(data.title && { title: data.title }),
        ...(data.author && { author: data.author }),
        ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl || null }),
        ...(data.readTime !== undefined && { readTime: data.readTime || null }),
        ...(data.description && { description: data.description }),
        ...(data.status && { status: data.status }),
      };

      const article = await prisma.article.update({
        where: { id },
        data: updateData,
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          moods: {
            include: {
              mood: true,
            },
          },
          goals: {
            include: {
              goal: true,
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
      });

      // Handle relations separately if provided
      if (data.categoryIds !== undefined) {
        // Delete existing relations
        await prisma.articleCategory.deleteMany({
          where: { articleId: id },
        });

        // Create new relations
        if (data.categoryIds.length > 0) {
          await prisma.articleCategory.createMany({
            data: data.categoryIds.map(categoryId => ({
              articleId: id,
              categoryId,
            })),
          });
        }
      }

      if (data.moodIds !== undefined) {
        // Delete existing relations
        await prisma.articleMood.deleteMany({
          where: { articleId: id },
        });

        // Create new relations
        if (data.moodIds.length > 0) {
          await prisma.articleMood.createMany({
            data: data.moodIds.map(moodId => ({
              articleId: id,
              moodId,
            })),
          });
        }
      }

      if (data.goalIds !== undefined) {
        // Delete existing relations
        await prisma.articleGoal.deleteMany({
          where: { articleId: id },
        });

        // Create new relations
        if (data.goalIds.length > 0) {
          await prisma.articleGoal.createMany({
            data: data.goalIds.map(goalId => ({
              articleId: id,
              goalId,
            })),
          });
        }
      }

      // Fetch updated article with relations
      const updatedArticle = await prisma.article.findUnique({
        where: { id },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          moods: {
            include: {
              mood: true,
            },
          },
          goals: {
            include: {
              goal: true,
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
      });

      return {
        success: true,
        message: 'Article updated successfully',
        data: updatedArticle,
      };
    } catch (error) {
      console.error('Update article error:', error);
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Failed to update article', 500);
    }
  }

  // Delete article
  static async deleteArticle(id: string) {
    try {
      // Check if article exists
      const existingArticle = await prisma.article.findUnique({
        where: { id },
      });

      if (!existingArticle) {
        throw AuthError.notFound('Article not found');
      }

      // Delete article (relations will be deleted due to cascade)
      await prisma.article.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Article deleted successfully',
        data: { id },
      };
    } catch (error) {
      console.error('Delete article error:', error);
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Failed to delete article', 500);
    }
  }

  // Get categories, moods, and goals for dropdowns
  static async getLibraryMetadata() {
    try {
      const [categories, moods, goals] = await Promise.all([
        prisma.categoryLabel.findMany({
          where: { status: 'ACTIVE' }, // Only get active categories
          orderBy: { name: 'asc' },
        }),
        prisma.moodLabel.findMany({
          orderBy: { name: 'asc' },
        }),
        prisma.goalLabel.findMany({
          orderBy: { name: 'asc' },
        }),
      ]);

      return {
        success: true,
        message: 'Library metadata retrieved successfully',
        data: {
          categories,
          moods,
          goals,
        },
      };
    } catch (error) {
      console.error('Get library metadata error:', error);
      throw new AuthError('Failed to retrieve library metadata', 500);
    }
  }
}
