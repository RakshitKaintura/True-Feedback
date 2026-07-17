import { handlers } from '@/auth';
import type { NextRequest } from 'next/server';

export function GET(
	request: NextRequest,
	_context: { params: Promise<{ nextauth: string[] }> }
) {
	return handlers.GET(request);
}

export function POST(
	request: NextRequest,
	_context: { params: Promise<{ nextauth: string[] }> }
) {
	return handlers.POST(request);
}