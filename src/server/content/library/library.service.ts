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

      // Only create notification for published articles (not drafts)
      console.log(`[LibraryService] Article created with status: ${article.status}, title: "${article.title}"`);
      
      if (article.status === 'PUBLISHED') {
        console.log(`[LibraryService] Checking for existing notification for article: ${article.id}`);
        
        // Check if notification already exists for this article
        const existingNotification = await prisma.adminNotification.findFirst({
          where: {
            type: 'system',
            message: {
              contains: `New article "${article.title}"`
            }
          }
        });

        console.log(`[LibraryService] Existing notification found: ${!!existingNotification}`);

        if (!existingNotification) {
          console.log(`[LibraryService] Creating new notification for published article: ${article.id} by user: ${userId}`);
          
          // Create notification for new article
          await prisma.adminNotification.create({
            data: {
              userId: userId,
              type: 'system',
              message: `New article "${article.title}" has been added by ${article.admin?.firstName || 'Admin'}`,
              severity: 'low',
              read: false
            }
          });

          console.log(`[LibraryService] Successfully created notification for article: ${article.id}`);

          // Also trigger real-time notification for the stream
          const notificationData = {
            id: article.id,
            type: 'system',
            message: `New article "${article.title}" has been added by ${article.admin?.firstName || 'Admin'}`,
            severity: 'low',
            timestamp: new Date().toISOString(),
            read: false,
            actionUrl: `/admin/library/articles/${article.id}`
          };

          console.log(`[LibraryService] Real-time notification data:`, notificationData);
        } else {
          console.log(`[LibraryService] Notification already exists for article: ${article.id}, skipping...`);
        }
      } else {
        console.log(`[LibraryService] Article is not published (status: ${article.status}), skipping notification creation`);
      }

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

  // Get all articles with pagination
  static async getAllArticles(userSchoolId?: string, timeRange?: string, page: number = 1, limit: number = 9) {
    try {
      const skip = (page - 1) * limit;
      
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
      
      // Add date filtering based on timeRange
      if (timeRange) {
        const now = new Date();
        let startDate = new Date();
        
        switch (timeRange) {
          case 'all':
            // For 'all', show lifetime data from the beginning
            startDate.setFullYear(2000, 0, 1); // January 1, 2000
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setDate(now.getDate() - 30);
            break;
          default:
            startDate.setHours(0, 0, 0, 0);
        }
        
        whereClause.createdAt = {
          gte: startDate,
          lte: now
        };
      }
      
      const [articles, totalCount] = await Promise.all([
        prisma.article.findMany({
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
          skip,
          take: limit,
        }),
        prisma.article.count({
          where: whereClause,
        }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        message: 'Articles retrieved successfully',
        data: articles,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
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

      // Check if status changed to PUBLISHED and create notification if needed
      if (data.status === 'PUBLISHED' && existingArticle && existingArticle.status !== 'PUBLISHED') {
        console.log(`[LibraryService] Article status changed to PUBLISHED: ${id}, checking for notification...`);
        
        // Check if notification already exists for this article
        const existingNotification = await prisma.adminNotification.findFirst({
          where: {
            type: 'system',
            message: {
              contains: `New article "${updatedArticle?.title || existingArticle?.title || 'Unknown'}"`
            }
          }
        });

        if (!existingNotification && updatedArticle) {
          console.log(`[LibraryService] Creating notification for newly published article: ${id}`);
          
          // Create notification for newly published article
          await prisma.adminNotification.create({
            data: {
              userId: updatedArticle?.createdBy || 'unknown',
              type: 'system',
              message: `New article "${updatedArticle?.title || 'Unknown'}" has been added by ${updatedArticle?.admin?.firstName || 'Admin'}`,
              severity: 'low',
              read: false
            }
          });

          console.log(`[LibraryService] Successfully created notification for newly published article: ${id}`);
        } else {
          console.log(`[LibraryService] Notification already exists or article not found, skipping...`);
        }
      }

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