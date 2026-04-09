import { NextRequest } from "next/server";
import { LibraryController } from "@/src/server/content/library/library.controller";

// GET /api/admin/articles - Get all articles (Admin & SuperAdmin)
export async function GET(request: NextRequest) {
  return await LibraryController.getArticles(request, { user: (request as any).user });
}

// POST /api/admin/articles - Create article (Admin & SuperAdmin)
export async function POST(request: NextRequest) {
  return await LibraryController.createArticle(request, { user: (request as any).user });
}
