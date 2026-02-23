import { NextRequest, NextResponse } from "next/server";
import {
  getStudentMeditations,
} from "@/src/server/controllers/meditation.student.controller";

export async function GET(request: NextRequest) {
  return await getStudentMeditations(request);
}
