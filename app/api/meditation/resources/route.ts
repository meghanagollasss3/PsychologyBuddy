import { NextResponse, NextRequest } from "next/server";
import prisma from "@/src/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Get published meditation resources without authentication
    const meditations = await prisma.meditation.findMany({
      where: {
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        title: true,
        durationSec: true,
        type: true,
        format: true,
        thumbnailUrl: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    return NextResponse.json({
      success: true,
      data: meditations,
      count: meditations.length
    });
  } catch (error) {
    console.error('Error fetching meditation resources:', error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch meditation resources",
        data: []
      },
      { status: 500 }
    );
  }
}
