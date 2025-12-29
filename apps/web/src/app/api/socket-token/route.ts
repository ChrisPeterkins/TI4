import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { auth } from '@/lib/auth';

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || '';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Sign a JWT for socket authentication
  const token = jwt.sign(
    {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
    NEXTAUTH_SECRET,
    { expiresIn: '24h' }
  );

  return NextResponse.json({ token });
}
