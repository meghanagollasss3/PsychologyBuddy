import { NextRequest, NextResponse } from "next/server";
import {
  getStudentMeditationCategories,
} from "@/src/server/controllers/meditation.student.controller";

export async function GET(request: NextRequest) {
  return await getStudentMeditationCategories(request);
}
