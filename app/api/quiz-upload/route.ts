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
    
    // Rebuild FormData with proper handling
    const newFormData = new FormData();
    
    console.log('=== FormData received ===');
    let fieldCount = 0;
    let fileCount = 0;
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  📁 ${key}: ${value.name} (${value.size} bytes)`);
        // Read file as arrayBuffer and create Blob with correct type
        const arrayBuffer = await value.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: value.type || 'image/jpeg' });
        newFormData.append(key, blob, value.name);
        fileCount++;
      } else {
        console.log(`  📝 ${key}: ${String(value).substring(0, 30)}`);
        // Append text entries as-is
        newFormData.append(key, value);
        fieldCount++;
      }
    }
    console.log(`Total: ${fieldCount} fields, ${fileCount} files\n`);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.learnoo.app';
    
    console.log(`🚀 Forwarding to: ${apiUrl}/v1/quiz`);

    // Forward FormData as-is to backend
    const backendResponse = await fetch(`${apiUrl}/v1/quiz`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        accept:"Application/json"
      },
      body: newFormData, // Send rebuilt FormData
    });

    console.log('Backend response status:', backendResponse.status);

    const responseText = await backendResponse.text();
    
    // Try to parse as JSON
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      console.error('❌ Backend returned non-JSON response');
      console.error('Response text:', responseText.substring(0, 500));
      return NextResponse.json(
        { 
          message: 'Backend API error',
          details: responseText.substring(0, 500),
          status: backendResponse.status
        },
        { status: backendResponse.status }
      );
    }

    if (!backendResponse.ok) {
      console.error('❌ Backend error:', result);
      return NextResponse.json(
        result || { message: 'Failed to create quiz' },
        { status: backendResponse.status }
      );
    }

    console.log('✅ Quiz created successfully');
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('❌ Quiz upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}
