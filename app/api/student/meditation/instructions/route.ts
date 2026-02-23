import { NextRequest, NextResponse } from "next/server";
import {
  getStudentMeditationInstructions,
} from "@/src/server/controllers/meditation.student.controller";

export async function GET(request: NextRequest) {
  return await getStudentMeditationInstructions(request);
}
