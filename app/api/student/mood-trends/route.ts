import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/src/utils/session-helper';
import { handleError } from '@/src/utils/errors';
import prisma from '@/src/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission(req, 'badges.view');

    // Get mood check-ins for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const moodCheckins = await prisma.moodCheckin.findMany({
      where: {
        userId: session.userId,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by day and calculate average mood score
    const weeklyData: Array<{
      day: string;
      moodScore: number;
      hasData: boolean;
    }> = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Initialize all 7 days with 0
    for (let i = 0; i < 7; i++) {
      weeklyData.push({
        day: dayNames[i],
        moodScore: 0,
        hasData: false,
      });
    }

    // Fill in actual mood data - convert mood string to score
    moodCheckins.forEach(checkin => {
      const dayOfWeek = new Date(checkin.createdAt).getDay();
      
      // Convert mood string to numeric score - matches student service implementation
      let moodScore = 0;
      switch (checkin.mood.toLowerCase()) {
        case 'happy': moodScore = 5; break;
        case 'okay': moodScore = 4; break;
        case 'sad': moodScore = 2; break;
        case 'anxious': moodScore = 1; break;
        case 'tired': moodScore = 3; break;
        default: moodScore = 3; // default to neutral
      }
      
      weeklyData[dayOfWeek].moodScore = moodScore;
      weeklyData[dayOfWeek].hasData = true;
    });

    // Rotate the data so current day is at the end
    const today = new Date().getDay();
    const rotatedData = [];
    const rotatedLabels = [];
    
    // Start from tomorrow (today + 1) and go to today
    for (let i = 1; i <= 7; i++) {
      const dayIndex = (today + i) % 7;
      rotatedData.push(weeklyData[dayIndex]);
      rotatedLabels.push(dayNames[dayIndex]);
    }

    return NextResponse.json({
      success: true,
      message: 'Weekly mood trends retrieved successfully',
      data: {
        weeklyData: rotatedData,
        totalCheckins: moodCheckins.length,
        averageMood: moodCheckins.length > 0 
          ? rotatedData.reduce((sum, day) => sum + (day.hasData ? day.moodScore : 0), 0) / rotatedData.filter(day => day.hasData).length
          : 0,
      },
    });
  } catch (err) {
    const errorResponse = handleError(err);
    return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
}
