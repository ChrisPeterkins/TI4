import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch public lobbies from the game server
    const response = await fetch(`${SERVER_URL}/api/lobbies`);

    if (!response.ok) {
      return NextResponse.json([]);
    }

    const lobbies = await response.json();
    return NextResponse.json(lobbies);
  } catch {
    // Return empty array if server is not available
    return NextResponse.json([]);
  }
}
