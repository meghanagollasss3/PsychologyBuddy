import { StudentRepository } from './student.repository';
import { PasswordUtil } from '@/src/utils/password.util';
import { ApiResponse } from '@/src/utils/api-response';
import { AuthError } from '@/src/utils/errors';
import { CreateStudentData, UpdateStudentData, StudentSelfUpdateData, ResetStudentPasswordData, UpdateStudentStatusData } from './student.validators';
import { ExtendedUpdateStudentData } from './student.repository';
import prisma from '@/src/prisma';

export class StudentService {
  static studentSelfUpdate(id: any, validatedData: { profileImage?: string | undefined; }) {
    throw new Error('Method not implemented.');
  }
  static async updateStudent(id: any, validatedData: ExtendedUpdateStudentData) {
    try {
      // Check if student exists
      const existingStudent = await StudentRepository.getStudentById(id);
      if (!existingStudent) {
        throw AuthError.notFound('Student not found');
      }

      // Update student data in User table and StudentProfile
      const updatedStudent = await StudentRepository.updateStudent(id, validatedData);

      return ApiResponse.success(updatedStudent, 'Student updated successfully');
    } catch (error) {
      throw error;
    }
  }
  // Create student (Admin only)
  static async createStudent(data: CreateStudentData, creatorId: string, schoolId: string) {
    try {
      // Auto-generate studentId if not provided
      let studentId = data.studentId;
      if (!studentId) {
        const generatedIdResult = await StudentRepository.generateUniqueStudentId(schoolId, data.classId);
        studentId = generatedIdResult;
      }

      // Use provided schoolId from parameter
      const finalSchoolId = schoolId;

      // Check if student with this ID already exists in the same school
      const existingStudent = await StudentRepository.findStudentByStudentId(studentId);
      if (existingStudent && existingStudent.schoolId === finalSchoolId) {
        throw AuthError.conflict('Student with this ID already exists');
      }

      // Check if student email already exists (both provided and generated)
      const emailToCheck = data.email || `${studentId.toLowerCase()}@school.local`;
      const existingEmail = await prisma.user.findUnique({
        where: { email: emailToCheck }
      });
      if (existingEmail) {
        throw AuthError.conflict('Student with this email already exists');
      }

      // Get student role
      const studentRole = await prisma.role.findUnique({
        where: { name: 'STUDENT' },
      });

      if (!studentRole) {
        throw new Error('Student role not found');
      }

      // Generate password if not provided
      const password = data.password || `Student@${Date.now()}`;

      // Hash password
      const hashedPassword = await PasswordUtil.hash(password);

      // Create student with profile
      const student = await StudentRepository.createStudent({
        ...data,
        studentId,
        password: hashedPassword,
        roleId: studentRole.id,
        schoolId: finalSchoolId,
      });

      // Remove password from response
      const { password: _, ...studentWithoutPassword } = student;

      return ApiResponse.success(studentWithoutPassword, 'Student created successfully');
    } catch (error: any) {
      // Handle unique constraint violation as fallback
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new Error('A user with this email already exists');
      }
      throw error;
    }
  }

  // Get students by school (Admin only - school-scoped)
  static async getStudentsBySchool(schoolId?: string, filters?: { search?: string; status?: string; classId?: string; locationId?: string; page?: number; limit?: number }) {
    try {
      const result = await StudentRepository.getStudentsBySchool(schoolId, filters);
      const { students, pagination } = result;

      // Define mood scores for calculations
      const moodScores: Record<string, number> = {
        'Happy': 5,
        'Okay': 4,
        'Sad': 2,
        'Anxious': 1,
        'Tired': 3
      };

      // Calculate mood metrics for each student
      const studentsWithMetrics = await Promise.all(
        students.map(async (student) => {
          // Get all mood check-ins for this student
          const moodCheckins = await prisma.moodCheckin.findMany({
            where: {
              userId: student.id
            },
            orderBy: {
              createdAt: 'desc'
            }
          });

          // Calculate metrics
          let lastCheckinDate = null;
          let totalCheckins = moodCheckins.length;
          let averageMoodScore = 0;

          if (moodCheckins.length > 0) {
            // Last check-in date
            lastCheckinDate = moodCheckins[0].createdAt;

            // Calculate average mood score
            const totalScore = moodCheckins.reduce((sum, checkin) => {
              return sum + (moodScores[checkin.mood] || 3); // Default to 3 if mood not found
            }, 0);
            averageMoodScore = totalScore / moodCheckins.length;
          }

          return {
            ...student,
            studentProfile: {
              ...student.studentProfile,
              lastMoodCheckin: lastCheckinDate,
              averageMood: averageMoodScore
            },
            _count: {
              ...student._count,
              // Use resolved escalation alerts as session count
              sessions: student._count.escalationAlerts
            }
          };
        })
      );

      // Remove passwords from response
      const studentsWithoutPasswords = studentsWithMetrics.map(student => {
        const { password, ...studentWithoutPassword } = student;
        return studentWithoutPassword;
      });

      return ApiResponse.success({
        students: studentsWithoutPasswords,
        pagination
      }, 'Students retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  // Get student by ID
  static async getStudentById(id: string, requesterId?: string) {
    try {
      const student = await StudentRepository.getStudentById(id);
      
      if (!student) {
        throw AuthError.notFound('Student not found');
      }

      // Remove password from response
      const { password, ...studentWithoutPassword } = student;

      return ApiResponse.success(studentWithoutPassword, 'Student retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  // Get student profile for admin view (Admin only)
  static async getStudentProfileForAdmin(id: string, requesterId?: string) {
    try {
      console.log('Fetching student profile for admin view, ID:', id);
      const student = await StudentRepository.getStudentById(id);
      
      if (!student) {
        console.log('Student not found');
        throw AuthError.notFound('Student not found');
      }

      // Fetch real mood data to calculate average
      const moodCheckins = await prisma.moodCheckin.findMany({
        where: { userId: student.id },
        select: { mood: true, date: true }
      });

      // Define mood scores for calculations
      const moodScores: Record<string, number> = {
        'Happy': 5,
        'Okay': 4,
        'Sad': 2,
        'Anxious': 1,
        'Tired': 3
      };

      // Calculate real average mood
      const averageMood = moodCheckins.length > 0 
        ? moodCheckins.reduce((sum, checkin) => sum + (moodScores[checkin.mood] || 3), 0) / moodCheckins.length
        : 0;

      // Fetch real session and alert data
      const escalationAlerts = await prisma.escalationAlert.findMany({
        where: { studentId: student.id },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      const userBadges = await prisma.userBadge.findMany({
        where: { userId: student.id },
        include: { badge: true },
        orderBy: { earnedAt: 'desc' },
        take: 5
      });

      // Create support sessions from resolved alerts
      const completedSessions = await Promise.all(
        escalationAlerts.filter(alert => alert.status === 'resolved').map(async (alert) => {
          console.log('Processing resolved alert:', {
            id: alert.id,
            category: alert.category,
            assignedTo: alert.assignedTo,
            status: alert.status
          });
          
          // Get the admin who resolved the alert via AdminNotification
          let adminName = "Dr. Sarah Williams"; // Default fallback
          
          try {
            // Find any admin notification for this alert
            const adminNotification = await prisma.adminNotification.findFirst({
              where: { 
                alertId: alert.id
              },
              include: {
                user: {
                  select: { firstName: true, lastName: true }
                }
              },
              orderBy: { createdAt: 'desc' }
            });
            
            if (adminNotification?.user) {
              adminName = `Dr. ${adminNotification.user.firstName} ${adminNotification.user.lastName}`;
            }
          } catch (error) {
            console.log('Could not fetch admin info for alert:', alert.id, error);
          }

          return {
            id: alert.id,
            doctor: adminName,
            title: `Resolved: ${alert.category}`,
            date: new Date(alert.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: "3:30 PM",
            duration: "45 min",
            status: "Completed",
            notes: alert.description,
            recommendations: alert.recommendation ? [alert.recommendation] : [],
            observations: `Alert resolved - ${alert.notes || 'No additional notes'}`
          };
        })
      );

      // Create recent activity from alerts, badges, and checkins
      const recentActivity = [
        ...escalationAlerts.slice(0, 3).map(alert => ({
          id: `alert-${alert.id}`,
          type: 'alert' as const,
          message: alert.status === 'resolved' ? `Alert resolved: ${alert.category}` : `Alert triggered: ${alert.category}`,
          time: `${Math.floor((Date.now() - new Date(alert.createdAt).getTime()) / (1000 * 60 * 60))} hours ago`
        })),
        ...userBadges.slice(0, 2).map(userBadge => ({
          id: `badge-${userBadge.id}`,
          type: 'badge' as const,
          message: `Earned '${userBadge.badge.name}' badge`,
          time: `${Math.floor((Date.now() - new Date(userBadge.earnedAt).getTime()) / (1000 * 60 * 60 * 24))} days ago`
        })),
        ...moodCheckins.slice(0, 2).map((checkin, index) => ({
          id: `checkin-${index}`,
          type: 'checkin' as const,
          message: 'Completed daily mood check-in',
          time: `${Math.floor((Date.now() - new Date(checkin.date || new Date()).getTime()) / (1000 * 60 * 60))} hours ago`
        }))
      ].sort((a, b) => {
        // Sort by time (newest first) - this is a simple approximation
        return a.id.localeCompare(b.id);
      });

      // Return comprehensive profile data for admin view
      const profileData = {
        id: student.id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
        status: student.studentProfile?.status || 'ACTIVE',
        classRef: student.classRef ? {
          id: student.classRef.id,
          name: student.classRef.name
        } : null,
        school: student.school ? {
          id: student.school.id,
          name: student.school.name
        } : null,
        studentProfile: {
          lastMoodCheckin: student.createdAt?.toISOString().split('T')[0] || null, // Use createdAt as fallback
          averageMood: averageMood,
          riskLevel: "LOW", // Default risk level since not in schema
          profileImage: student.studentProfile?.profileImage || null,
          totalCheckIns: moodCheckins.length,
          streakDays: 0, // Default since not in schema
          joinDate: student.createdAt?.toISOString().split('T')[0],
        },
        emergencyContact: student.studentProfile?.emergencyContact || {
          name: "Not provided",
          phone: "Not provided",
          relationship: "Not specified"
        },
        _count: {
          sessions: completedSessions.length,
          moodCheckins: moodCheckins.length,
          chatSessions: 23, // Mock data for now
        },
        recentMoods: moodCheckins.slice(0, 10).map((checkin, index) => ({
          id: `${index + 1}`,
          date: new Date(checkin.date || new Date()).toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
          }).replace(/^\w+,\s/, ''),
          mood: checkin.mood,
          emoji: moodScores[checkin.mood] >= 4 ? '😊' : moodScores[checkin.mood] >= 3 ? '😐' : '😰',
          fullDate: new Date(checkin.date || new Date()).toISOString().split('T')[0]
        })),
        sessions: completedSessions,
        recentActivity: recentActivity,
        badges: userBadges.map(userBadge => userBadge.badge.name),
      };

      return ApiResponse.success(profileData, 'Student profile retrieved successfully');
    } catch (error) {
      throw error;
    }
  }

  // Reset student password (Admin only)
  static async resetStudentPassword(id: string, data: ResetStudentPasswordData) {
    try {
      // Check if student exists
      const existingStudent = await StudentRepository.getStudentById(id);
      if (!existingStudent) {
        throw AuthError.notFound('Student not found');
      }

      // Hash new password
      const hashedPassword = await PasswordUtil.hash(data.newPassword);

      // Update password
      const updatedStudent = await StudentRepository.updateStudentPassword(id, hashedPassword);

      return ApiResponse.success(updatedStudent, 'Student password reset successfully');
    } catch (error) {
      throw error;
    }
  }

  // Update student status (Admin only)
  static async updateStudentStatus(id: string, data: UpdateStudentStatusData) {
    try {
      // Check if student exists
      const existingStudent = await StudentRepository.getStudentById(id);
      if (!existingStudent) {
        throw AuthError.notFound('Student not found');
      }

      // Update status
      const updatedStudent = await StudentRepository.updateStudentStatus(id, data.status);

      // Remove password from response
      const { password, ...studentWithoutPassword } = updatedStudent;

      return ApiResponse.success(studentWithoutPassword, `Student status updated to ${data.status}`);
    } catch (error) {
      throw error;
    }
  }

  // Delete student (Admin only - hard delete)
  static async deleteStudent(id: string) {
    try {
      // Check if student exists
      const existingStudent = await StudentRepository.getStudentById(id);
      if (!existingStudent) {
        throw AuthError.notFound('Student not found');
      }

      // Hard delete - completely remove from database
      const deletedStudent = await StudentRepository.deleteStudent(id);

      // Remove password from response
      const { password, ...studentWithoutPassword } = deletedStudent;

      return ApiResponse.success(studentWithoutPassword, 'Student deleted permanently from the system');
    } catch (error) {
      throw error;
    }
  }

  // Generate unique student ID
  static async generateUniqueStudentId(schoolId: string, classId: string) {
    try {
      const studentId = await StudentRepository.generateUniqueStudentId(schoolId, classId);
      return ApiResponse.success({ studentId }, 'Student ID generated successfully');
    } catch (error) {
      throw error;
    }
  }

  // Generate student email
  static async generateStudentEmail(studentId: string, schoolDomain: string) {
    try {
      const email = await StudentRepository.generateStudentEmail(studentId, schoolDomain);
      return ApiResponse.success({ email }, 'Student email generated successfully');
    } catch (error) {
      throw error;
    }
  }

  // Update student profile
  static async updateStudentProfile(studentId: string, data: any, photo?: File) {
    try {
      const prisma = (global as any).prisma;

      // Update basic student information in User table
      const updatedStudent = await prisma.user.update({
        where: { id: studentId },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        }
      });

      // Update StudentProfile with dateOfBirth and emergencyContact
      const profileUpdateData: any = {};
      
      if (data.dateOfBirth) {
        profileUpdateData.dateOfBirth = new Date(data.dateOfBirth);
      }
      
      if (data.emergencyContact?.phone) {
        profileUpdateData.emergencyContact = data.emergencyContact;
      }

      // Update profile if there's data to update
      if (Object.keys(profileUpdateData).length > 0) {
        await prisma.studentProfile.upsert({
          where: { userId: studentId },
          update: profileUpdateData,
          create: {
            userId: studentId,
            ...profileUpdateData
          }
        });
      }

      // Handle photo upload if provided
      if (photo) {
        try {
          // Create uploads directory if it doesn't exist
          const fs = require('fs');
          const path = require('path');
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
          
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }

          // Generate unique filename
          const fileExtension = photo.name.split('.').pop();
          const fileName = `${studentId}_${Date.now()}.${fileExtension}`;
          const filePath = path.join(uploadsDir, fileName);

          // Convert File to Buffer and save
          const bytes = await photo.arrayBuffer();
          const buffer = Buffer.from(bytes);
          fs.writeFileSync(filePath, buffer);

          // Update profile image in database
          const imageUrl = `/uploads/profiles/${fileName}`;
          await prisma.studentProfile.upsert({
            where: { userId: studentId },
            update: { profileImage: imageUrl },
            create: {
              userId: studentId,
              profileImage: imageUrl
            }
          });

          console.log('Photo uploaded successfully:', imageUrl);
        } catch (photoError) {
          console.error('Photo upload error:', photoError);
          // Continue with profile update even if photo fails
        }
      }

      return {
        success: true,
        message: "Profile updated successfully",
        data: updatedStudent
      };
    } catch (error) {
      console.error('Update student profile service error:', error);
      throw error;
    }
  }

  // Get student profile for student view (Student only)
  static async getStudentProfileForStudent(id: string) {
    try {
      const student = await StudentRepository.getStudentById(id);
      
      if (!student) {
        throw AuthError.notFound('Student not found');
      }

      // Fetch mood checkins
      const moodCheckins = await prisma.moodCheckin.findMany({
        where: { userId: student.id },
        select: { mood: true, date: true },
        orderBy: { date: 'desc' },
        take: 10
      });

      // Fetch chat sessions
      const chatSessions = await prisma.chatSession.findMany({
        where: { userId: student.id },
        orderBy: { startedAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Fetch escalation alerts to get resolved sessions
      const escalationAlerts = await prisma.escalationAlert.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: 'desc' }
      });

      console.log('Found chat sessions:', chatSessions.length);
      console.log('Found escalation alerts:', escalationAlerts.length);
      console.log('Resolved alerts:', escalationAlerts.filter(alert => alert.status === 'resolved').length);

      // Fetch user badges
      const userBadges = await prisma.userBadge.findMany({
        where: { userId: student.id },
        include: { badge: true },
        orderBy: { earnedAt: 'desc' },
        take: 10
      });

      // Fetch journals for activity
      const writingJournals = await prisma.writingJournal.findMany({
        where: { userId: student.id },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      console.log('Writing journals for activity:', writingJournals.length, writingJournals);

      // Note: Meditation model doesn't track user usage, only admin creation
      // For now, we'll only track journal and mood check-in activities

      // Fetch meditation saves for activity tracking
      const meditationSaves = await prisma.meditationSave.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      // Fetch article completions for activity tracking
      const articleCompletions = await prisma.articleCompletion.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      // Create sessions from resolved escalation alerts only
      const resolvedAlertSessions = await Promise.all(
        escalationAlerts
          .filter(alert => alert.status === 'resolved')
          .map(async (alert) => {
            console.log('Processing resolved alert as completed session:', {
              id: alert.id,
              category: alert.category,
              status: alert.status,
              createdAt: alert.createdAt
            });
            
            // Get the admin who resolved the alert via AdminNotification
            let adminName = "Dr. Support Team"; // Default fallback
            
            try {
              const adminNotification = await prisma.adminNotification.findFirst({
                where: { 
                  alertId: alert.id
                },
                include: {
                  user: {
                    select: { firstName: true, lastName: true }
                  }
                },
                orderBy: { createdAt: 'desc' }
              });
              
              if (adminNotification?.user) {
                adminName = `Dr. ${adminNotification.user.firstName} ${adminNotification.user.lastName}`;
              }
            } catch (error) {
              console.log('Could not fetch admin info for alert:', alert.id, error);
            }

            return {
              id: `alert-${alert.id}`,
              date: new Date(alert.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              time: new Date(alert.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
              type: `Support Session - ${alert.category}`,
              doctor: adminName,
              status: 'Completed'
            };
          })
      );

      // Create sessions from active escalation alerts (in progress)
      const activeAlertSessions = escalationAlerts
        .filter(alert => alert.status === 'open')
        .map(alert => {
          console.log('Processing active alert as in-progress session:', {
            id: alert.id,
            category: alert.category,
            status: alert.status,
            createdAt: alert.createdAt
          });

          return {
            id: `alert-${alert.id}`,
            date: new Date(alert.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: new Date(alert.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            type: `Support Session - ${alert.category}`,
            doctor: 'Support Team',
            status: 'In Progress'
          };
        });

      // Combine both active and resolved alert sessions
      const allSessions = [...activeAlertSessions, ...resolvedAlertSessions].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      console.log('Total sessions created:', allSessions.length);
      console.log('Active alert sessions:', activeAlertSessions.length);
      console.log('Resolved alert sessions:', resolvedAlertSessions.length);

      // Create activity list with all required activity types
      const activities = [
        // Add mood check-ins
        ...moodCheckins.slice(0, 5).map((checkin, index) => ({
          id: `checkin-${index}`,
          type: 'checkin',
          title: 'Mood check-in completed',
          details: checkin.mood ? `Mood: ${checkin.mood}` : 'Daily mood tracking',
          time: this.getTimeAgo(new Date(checkin.date || new Date())),
          date: checkin.date || new Date()
        })),
        // Add journaling activities if they exist
        ...(writingJournals.length > 0 ? writingJournals.map(journal => ({
          id: `journal-${journal.id}`,
          type: 'journaling',
          title: 'Journaling session completed',
          details: journal.content ? `Wrote ${journal.content.length} characters` : 'Private journal entry',
          time: this.getTimeAgo(new Date(journal.createdAt)),
          date: journal.createdAt
        })) : []),
        // Add meditation activities if they exist
        ...(meditationSaves.length > 0 ? meditationSaves.map(meditation => ({
          id: `meditation-${meditation.id}`,
          type: 'meditation',
          title: 'Meditation session completed',
          details: 'Meditation practice',
          time: this.getTimeAgo(new Date(meditation.createdAt)),
          date: meditation.createdAt
        })) : []),
        // Add article reading activities if they exist
        ...(articleCompletions.length > 0 ? articleCompletions.map(completion => ({
          id: `article-${completion.id}`,
          type: 'reading',
          title: 'Article completed',
          details: 'Article reading',
          time: this.getTimeAgo(new Date(completion.createdAt)),
          date: completion.createdAt
        })) : []),
        // Add badges earned activities
        ...userBadges.slice(0, 3).map(userBadge => ({
          id: `badge-${userBadge.id}`,
          type: 'tool',
          title: 'Badge earned',
          details: `Earned "${userBadge.badge.name}" badge`,
          time: this.getTimeAgo(new Date(userBadge.earnedAt)),
          date: userBadge.earnedAt
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

      console.log('Writing journals for activity:', writingJournals.length, writingJournals);
      console.log('Mood check-ins for activity:', moodCheckins.length, moodCheckins);
      console.log('Meditation saves for activity:', meditationSaves.length, meditationSaves);
      console.log('Article completions for activity:', articleCompletions.length, articleCompletions);
      console.log('Final activities array:', activities.length, activities);
      console.log('All sessions array (active + resolved alerts):', allSessions.length, allSessions);

      // Return student profile data
      const profileData = {
        student: {
          id: student.id,
          studentId: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
          fullName: `${student.firstName} ${student.lastName}`,
          email: student.email,
          phone: student.phone,
          dateOfBirth: student.studentProfile?.dateOfBirth || null,
          grade: student.classRef ? `${student.classRef.grade}th Grade` : 'Not Assigned',
          status: student.studentProfile?.status || 'ACTIVE',
          profileImage: student.studentProfile?.profileImage || null,
          memberSince: student.createdAt?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) || 'Unknown',
          emergencyContact: student.studentProfile?.emergencyContact || {
            name: "Emergency Contact",
            phone: student.phone || '+91 0000000000'
          }
        },
        allSessions, // Use allSessions instead of sessions
        activities,
        badges: userBadges.map(ub => ({
          id: ub.badge.id,
          name: ub.badge.name,
          description: ub.badge.description,
          iconUrl: ub.badge.icon, // Use icon field from Badge model
          earnedAt: ub.earnedAt
        })),
        stats: {
          totalSessions: allSessions.length, // Only resolved escalation alerts
          totalJournals: writingJournals.length,
          totalMeditations: 0, // Meditation usage not tracked in current schema
          totalBadges: userBadges.length,
          currentStreak: 7 // Mock data for now
        }
      };

      return ApiResponse.success(profileData, 'Student profile retrieved successfully');
    } catch (error) {
      console.error('Get student profile for student error:', error);
      throw error;
    }
  }

  // Helper method to calculate time ago
  private static getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''} ago`;
    }
  }
}