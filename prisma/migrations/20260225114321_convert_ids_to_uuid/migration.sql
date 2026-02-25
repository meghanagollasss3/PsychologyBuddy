/*
  Warnings:

  - You are about to drop the column `category` on the `Meditation` table. All the data in the column will be lost.
  - You are about to drop the column `goal` on the `Meditation` table. All the data in the column will be lost.
  - You are about to drop the column `supportedMoods` on the `Meditation` table. All the data in the column will be lost.
  - You are about to drop the `MeditationCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MeditationGoal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MoodLabels` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MusicCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MusicGoal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MusicMood` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Streaks` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Meditation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM ('STREAK', 'JOURNAL_COUNT', 'ARTICLE_READ', 'MEDITATION_COUNT', 'MUSIC_COUNT', 'MOOD_CHECKIN');

-- DropForeignKey
ALTER TABLE "ArticleMood" DROP CONSTRAINT "ArticleMood_moodId_fkey";

-- DropForeignKey
ALTER TABLE "MeditationCategory" DROP CONSTRAINT "MeditationCategory_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "MeditationCategory" DROP CONSTRAINT "MeditationCategory_meditationId_fkey";

-- DropForeignKey
ALTER TABLE "MeditationGoal" DROP CONSTRAINT "MeditationGoal_goalId_fkey";

-- DropForeignKey
ALTER TABLE "MeditationGoal" DROP CONSTRAINT "MeditationGoal_meditationId_fkey";

-- DropForeignKey
ALTER TABLE "MeditationMood" DROP CONSTRAINT "MeditationMood_moodId_fkey";

-- DropForeignKey
ALTER TABLE "MusicCategory" DROP CONSTRAINT "MusicCategory_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "MusicCategory" DROP CONSTRAINT "MusicCategory_musicId_fkey";

-- DropForeignKey
ALTER TABLE "MusicGoal" DROP CONSTRAINT "MusicGoal_goalId_fkey";

-- DropForeignKey
ALTER TABLE "MusicGoal" DROP CONSTRAINT "MusicGoal_musicId_fkey";

-- DropForeignKey
ALTER TABLE "MusicMood" DROP CONSTRAINT "MusicMood_moodId_fkey";

-- DropForeignKey
ALTER TABLE "MusicMood" DROP CONSTRAINT "MusicMood_musicId_fkey";

-- DropIndex
DROP INDEX "Classes_schoolId_grade_section_key";

-- AlterTable
ALTER TABLE "Articles" ADD COLUMN     "averageRating" DOUBLE PRECISION,
ADD COLUMN     "ratingCount" INTEGER,
ADD COLUMN     "readTime" INTEGER,
ADD COLUMN     "schoolId" TEXT,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "CategoryLabels" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "GoalLabels" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Meditation" DROP COLUMN "category",
DROP COLUMN "goal",
DROP COLUMN "supportedMoods",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "instructor" TEXT,
ADD COLUMN     "schoolId" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'GUIDED',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "MeditationCategory";

-- DropTable
DROP TABLE "MeditationGoal";

-- DropTable
DROP TABLE "MoodLabels";

-- DropTable
DROP TABLE "MusicCategory";

-- DropTable
DROP TABLE "MusicGoal";

-- DropTable
DROP TABLE "MusicMood";

-- CreateTable
CREATE TABLE "JournalingPrompts" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "moodIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "JournalingPrompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicInstructions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "duration" INTEGER,
    "difficulty" TEXT NOT NULL DEFAULT 'BEGINNER',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "schoolId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "proTip" TEXT,

    CONSTRAINT "MusicInstructions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeditationListeningInstructions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "duration" INTEGER,
    "difficulty" TEXT NOT NULL DEFAULT 'BEGINNER',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT,
    "schoolId" TEXT,
    "resourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "proTip" TEXT,

    CONSTRAINT "MeditationListeningInstructions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeditationMeditationCategories" (
    "id" TEXT NOT NULL,
    "meditationId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeditationMeditationCategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeditationMeditationGoals" (
    "id" TEXT NOT NULL,
    "meditationId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeditationMeditationGoals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeditationCategories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeditationCategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeditationGoals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeditationGoals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ratings" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "studentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedArticles" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "studentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedArticles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleCompletions" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "studentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleCompletions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeditationSaves" (
    "id" TEXT NOT NULL,
    "meditationId" TEXT NOT NULL,
    "studentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeditationSaves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicSaves" (
    "id" TEXT NOT NULL,
    "musicId" TEXT NOT NULL,
    "studentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MusicSaves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscalationAlerts" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "studentClass" TEXT,
    "sessionId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "severity" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "detectedPhrases" TEXT[],
    "context" TEXT,
    "recommendation" TEXT,
    "description" TEXT NOT NULL,
    "detectionMethod" TEXT NOT NULL,
    "messageContent" TEXT NOT NULL,
    "messageTimestamp" TEXT NOT NULL,
    "requiresImmediateAction" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "assignedTo" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscalationAlerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminNotifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertId" TEXT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "AdminNotifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoodLabel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',

    CONSTRAINT "MoodLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleBlocks" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "content" JSONB NOT NULL,

    CONSTRAINT "ArticleBlocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageBlocks" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "src" TEXT NOT NULL,
    "altText" TEXT,
    "caption" TEXT,

    CONSTRAINT "ImageBlocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyTakeawaysBlocks" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT,
    "items" TEXT[],

    CONSTRAINT "KeyTakeawaysBlocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReflectionBlocks" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "heading" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "prompt" TEXT,

    CONSTRAINT "ReflectionBlocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkBlocks" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "LinkBlocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionBlocks" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "SectionBlocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulletListBlocks" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "items" TEXT[],

    CONSTRAINT "BulletListBlocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicMoods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicMoods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicResourceMoods" (
    "id" TEXT NOT NULL,
    "musicResourceId" TEXT NOT NULL,
    "moodId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MusicResourceMoods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicResources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "duration" INTEGER,
    "artist" TEXT,
    "album" TEXT,
    "coverImage" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "schoolId" TEXT,
    "categoryId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "thumbnailUrl" TEXT,

    CONSTRAINT "MusicResources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicCategories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicCategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicResourceCategories" (
    "id" TEXT NOT NULL,
    "musicResourceId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MusicResourceCategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicGoals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicGoals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicResourceGoals" (
    "id" TEXT NOT NULL,
    "musicResourceId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MusicResourceGoals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirement" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "type" "BadgeType" NOT NULL,
    "conditionValue" INTEGER,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT,

    CONSTRAINT "Badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MeditationMeditationCategories_meditationId_categoryId_key" ON "MeditationMeditationCategories"("meditationId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "MeditationMeditationGoals_meditationId_goalId_key" ON "MeditationMeditationGoals"("meditationId", "goalId");

-- CreateIndex
CREATE UNIQUE INDEX "MeditationCategories_name_key" ON "MeditationCategories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MeditationGoals_name_key" ON "MeditationGoals"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Ratings_articleId_studentId_key" ON "Ratings"("articleId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedArticles_articleId_studentId_key" ON "SavedArticles"("articleId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleCompletions_articleId_studentId_key" ON "ArticleCompletions"("articleId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "MeditationSaves_meditationId_studentId_key" ON "MeditationSaves"("meditationId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "MusicSaves_musicId_studentId_key" ON "MusicSaves"("musicId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "MoodLabel_name_key" ON "MoodLabel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MusicMoods_name_key" ON "MusicMoods"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MusicResourceMoods_musicResourceId_moodId_key" ON "MusicResourceMoods"("musicResourceId", "moodId");

-- CreateIndex
CREATE UNIQUE INDEX "MusicCategories_name_key" ON "MusicCategories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MusicResourceCategories_musicResourceId_categoryId_key" ON "MusicResourceCategories"("musicResourceId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "MusicGoals_name_key" ON "MusicGoals"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MusicResourceGoals_musicResourceId_goalId_key" ON "MusicResourceGoals"("musicResourceId", "goalId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadges_userId_badgeId_key" ON "UserBadges"("userId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "Streaks_userId_key" ON "Streaks"("userId");

-- AddForeignKey
ALTER TABLE "Meditation" ADD CONSTRAINT "Meditation_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "Schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeditationMood" ADD CONSTRAINT "MeditationMood_moodId_fkey" FOREIGN KEY ("moodId") REFERENCES "MoodLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicInstructions" ADD CONSTRAINT "MusicInstructions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicInstructions" ADD CONSTRAINT "MusicInstructions_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "Schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeditationListeningInstructions" ADD CONSTRAINT "MeditationListeningInstructions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeditationListeningInstructions" ADD CONSTRAINT "MeditationListeningInstructions_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "Schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeditationMeditationCategories" ADD CONSTRAINT "MeditationMeditationCategories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MeditationCategories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeditationMeditationCategories" ADD CONSTRAINT "MeditationMeditationCategories_meditationId_fkey" FOREIGN KEY ("meditationId") REFERENCES "Meditation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeditationMeditationGoals" ADD CONSTRAINT "MeditationMeditationGoals_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "MeditationGoals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeditationMeditationGoals" ADD CONSTRAINT "MeditationMeditationGoals_meditationId_fkey" FOREIGN KEY ("meditationId") REFERENCES "Meditation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Articles" ADD CONSTRAINT "Articles_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "Schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ratings" ADD CONSTRAINT "Ratings_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ratings" ADD CONSTRAINT "Ratings_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedArticles" ADD CONSTRAINT "SavedArticles_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedArticles" ADD CONSTRAINT "SavedArticles_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleCompletions" ADD CONSTRAINT "ArticleCompletions_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleCompletions" ADD CONSTRAINT "ArticleCompletions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleMood" ADD CONSTRAINT "ArticleMood_moodId_fkey" FOREIGN KEY ("moodId") REFERENCES "MoodLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationAlerts" ADD CONSTRAINT "EscalationAlerts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminNotifications" ADD CONSTRAINT "AdminNotifications_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "EscalationAlerts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminNotifications" ADD CONSTRAINT "AdminNotifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleBlocks" ADD CONSTRAINT "ArticleBlocks_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageBlocks" ADD CONSTRAINT "ImageBlocks_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyTakeawaysBlocks" ADD CONSTRAINT "KeyTakeawaysBlocks_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReflectionBlocks" ADD CONSTRAINT "ReflectionBlocks_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkBlocks" ADD CONSTRAINT "LinkBlocks_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionBlocks" ADD CONSTRAINT "SectionBlocks_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulletListBlocks" ADD CONSTRAINT "BulletListBlocks_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicResourceMoods" ADD CONSTRAINT "MusicResourceMoods_moodId_fkey" FOREIGN KEY ("moodId") REFERENCES "MusicMoods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicResourceMoods" ADD CONSTRAINT "MusicResourceMoods_musicResourceId_fkey" FOREIGN KEY ("musicResourceId") REFERENCES "MusicResources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicResources" ADD CONSTRAINT "MusicResources_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MusicCategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicResources" ADD CONSTRAINT "MusicResources_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "Schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicResourceCategories" ADD CONSTRAINT "MusicResourceCategories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MusicCategories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicResourceCategories" ADD CONSTRAINT "MusicResourceCategories_musicResourceId_fkey" FOREIGN KEY ("musicResourceId") REFERENCES "MusicResources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicResourceGoals" ADD CONSTRAINT "MusicResourceGoals_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "MusicGoals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicResourceGoals" ADD CONSTRAINT "MusicResourceGoals_musicResourceId_fkey" FOREIGN KEY ("musicResourceId") REFERENCES "MusicResources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Badges" ADD CONSTRAINT "Badges_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadges" ADD CONSTRAINT "UserBadges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadges" ADD CONSTRAINT "UserBadges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
