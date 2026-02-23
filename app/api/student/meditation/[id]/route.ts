import { NextRequest, NextResponse } from "next/server";
import {
  getStudentMeditationById,
} from "@/src/server/controllers/meditation.student.controller";

export async function GET(request: NextRequest) {
  return await getStudentMeditationById(request);
}
