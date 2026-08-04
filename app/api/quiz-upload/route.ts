import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get authorization token 
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                 request.cookies.get('token')?.value ||
                 request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized - No token found' },
        { status: 401 }
      );
    }

    // Get the raw body as FormData
    const formData = await request.formData();
    
    // Preserve multipart field names and File objects exactly as submitted.
    const newFormData = new FormData();
    for (const [key, value] of formData.entries()) {
      newFormData.append(key, value);
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.learnoo.app';

    // Forward FormData as-is to backend
    const backendResponse = await fetch(`${apiUrl}/v1/quiz`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        accept: 'application/json'
      },
      body: newFormData, // Send rebuilt FormData
    });

    const responseText = await backendResponse.text();
    
    // Try to parse as JSON
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { message: 'Backend API returned an invalid response' },
        { status: backendResponse.ok ? 502 : backendResponse.status }
      );
    }

    if (!backendResponse.ok) {
      return NextResponse.json(
        result || { message: 'Failed to create quiz' },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(result, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      { message: 'Quiz upload failed' },
      { status: 500 }
    );
  }
}
