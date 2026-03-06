import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/prisma";
import { authController } from "@/src/server/controllers/auth.controller";

interface EmotionalPatternData {
  mood: string;
  count: number;
  percentage: number;
  color: string;
}

interface TriggerData {
  trigger: string;
  count: number;
  percentage: number;
}

interface EmotionalPatternsResponse {
  emotionalPatterns: EmotionalPatternData[];
  triggerPatterns: TriggerData[];
  insights: {
    primary: string;
    secondary: string;
    recommendation: string;
  };
  totalCheckins: number;
  timeRange: string;
}

// Generate insights based on patterns
function generateTriggerInsights(
  emotionalPatterns: EmotionalPatternData[],
  triggerPatterns: TriggerData[],
  totalCheckins: number
): EmotionalPatternsResponse['insights'] {
  const insights = {
    primary: "",
    secondary: "",
    recommendation: ""
  };

  // Find dominant mood
  const dominantMood = emotionalPatterns[0];
  if (dominantMood) {
    if (dominantMood.mood === "Happy") {
      insights.primary = `You're generally feeling positive! ${dominantMood.percentage}% of your check-ins show happy moods.`;
    } else if (dominantMood.mood === "Anxious") {
      insights.primary = `You're experiencing anxiety frequently. ${dominantMood.percentage}% of your check-ins show anxious feelings.`;
    } else if (dominantMood.mood === "Sad") {
      insights.primary = `You're feeling sad quite often. ${dominantMood.percentage}% of your check-ins show sad moods.`;
    } else if (dominantMood.mood === "Tired") {
      insights.primary = `Fatigue seems to be affecting you. ${dominantMood.percentage}% of your check-ins show tiredness.`;
    } else {
      insights.primary = `You're maintaining emotional balance. ${dominantMood.percentage}% of your check-ins show neutral moods.`;
    }
  }

  // Find dominant trigger
  const dominantTrigger = triggerPatterns[0];
  if (dominantTrigger) {
    insights.secondary = `Your biggest trigger appears to be "${dominantTrigger.trigger}" affecting ${dominantTrigger.percentage}% of your emotional states.`;
    
    // Add specific recommendations based on trigger
    if (dominantTrigger.trigger === "Exams") {
      insights.recommendation = "Consider implementing study breaks, time management techniques, and stress-reduction exercises during exam periods.";
    } else if (dominantTrigger.trigger === "Friends") {
      insights.recommendation = "Social dynamics are impacting your mood. Practice setting boundaries and communicating your needs effectively.";
    } else if (dominantTrigger.trigger === "Sleep") {
      insights.recommendation = "Focus on improving sleep hygiene with consistent bedtime routines and limiting screen time before bed.";
    } else if (dominantTrigger.trigger === "Family") {
      insights.recommendation = "Family situations are affecting you. Consider open communication and finding healthy coping mechanisms.";
    } else if (dominantTrigger.trigger === "School work") {
      insights.recommendation = "Academic pressure is building up. Break tasks into smaller chunks and celebrate small achievements.";
    } else if (dominantTrigger.trigger === "Social pressure") {
      insights.recommendation = "Social pressure is impacting your wellbeing. Remember it's okay to say no and prioritize your mental health.";
    } else if (dominantTrigger.trigger === "Health") {
      insights.recommendation = "Health concerns are affecting your mood. Focus on self-care and consider speaking with a healthcare provider.";
    } else {
      insights.recommendation = "Continue monitoring your emotional patterns and practice self-awareness in daily situations.";
    }
  }

  // Special insights for specific patterns
  const anxiousPercentage = emotionalPatterns.find(p => p.mood === "Anxious")?.percentage || 0;
  const sadPercentage = emotionalPatterns.find(p => p.mood === "Sad")?.percentage || 0;
  
  if (anxiousPercentage > 40) {
    insights.recommendation += " Consider incorporating relaxation techniques like deep breathing or meditation into your daily routine.";
  }
  
  if (sadPercentage > 30) {
    insights.recommendation += " Reach out to trusted friends, family, or consider speaking with a counselor about your feelings.";
  }

  return insights;
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user using custom auth system
    const authResponse = await authController.me(request);
    const authData = await authResponse.json();
    
    if (!authData.success || !authData.data?.user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const user = authData.data.user;

    // Get query parameters for time range
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'month';
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Fetch mood check-ins
    const moodCheckins = await prisma.moodCheckin.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Fetch trigger selections for the same period
    const triggerSelections = await prisma.triggerSelection.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (moodCheckins.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          emotionalPatterns: [],
          triggerPatterns: [],
          insights: {
            primary: "No mood data available for the selected time period. Start checking in regularly to see your patterns.",
            secondary: "Consistent mood tracking helps identify emotional patterns and triggers.",
            recommendation: "Try to check in daily to build a comprehensive picture of your emotional wellbeing."
          },
          totalCheckins: 0,
          timeRange
        }
      });
    }

    // Process emotional patterns
    const moodCounts: Record<string, number> = {};
    moodCheckins.forEach(checkin => {
      const mood = checkin.mood;
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    });

    const totalCheckins = moodCheckins.length;
    const emotionalPatterns: EmotionalPatternData[] = Object.entries(moodCounts)
      .map(([mood, count]) => ({
        mood,
        count,
        percentage: Math.round((count / totalCheckins) * 100),
        color: getMoodColor(mood)
      }))
      .sort((a, b) => b.count - a.count);

    // Process trigger patterns
    const triggerCounts: Record<string, number> = {};
    triggerSelections.forEach(selection => {
      selection.triggers.forEach(trigger => {
        const triggerName = getTriggerName(trigger);
        triggerCounts[triggerName] = (triggerCounts[triggerName] || 0) + 1;
      });
    });

    const totalTriggers = Object.values(triggerCounts).reduce((sum, count) => sum + count, 0);
    const triggerPatterns: TriggerData[] = Object.entries(triggerCounts)
      .map(([trigger, count]) => ({
        trigger,
        count,
        percentage: Math.round((count / totalTriggers) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    // Generate insights
    const insights = generateTriggerInsights(emotionalPatterns, triggerPatterns, totalCheckins);

    return NextResponse.json({
      success: true,
      data: {
        emotionalPatterns,
        triggerPatterns,
        insights,
        totalCheckins,
        timeRange
      }
    });

  } catch (error) {
    console.error("Error fetching emotional patterns:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch emotional patterns" },
      { status: 500 }
    );
  }
}

// Helper functions
function getMoodColor(mood: string): string {
  const colors: Record<string, string> = {
    "Happy": "#FDE68A", // yellow-200
    "Okay": "#BFDBFE", // blue-200  
    "Sad": "#FECACA", // red-200
    "Anxious": "#DDD6FE", // purple-200
    "Tired": "#A7F3D0", // green-200
    "Calm": "#A7F3D0" // green-200
  };
  return colors[mood] || "#BFDBFE";
}

function getTriggerName(trigger: string): string {
  const triggerNames: Record<string, string> = {
    "Friends": "Friends",
    "Exams": "Exams",
    "Family": "Family",
    "Social Pressure": "Social pressure",
    "Sleep": "Sleep",
    "School": "School",
    "Health": "Health",
    "Others": "Others"
  };
  return triggerNames[trigger] || trigger;
}
