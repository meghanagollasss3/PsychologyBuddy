import { NextResponse } from "next/server";

// GET /api/admin/notifications/stream - Real-time notification stream
export async function GET(req: Request) {
  // Enable Server-Sent Events for real-time notifications
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode(`data: {"type":"connected","timestamp":"${new Date().toISOString()}"}\n\n`));

      // Keep connection alive with periodic heartbeats
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`data: {"type":"heartbeat","timestamp":"${new Date().toISOString()}"}\n\n`));
      }, 30000); // 30 seconds

      // Cleanup on disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        controller.close();
      });
    }
  });

  return new Response(stream, { headers });
}