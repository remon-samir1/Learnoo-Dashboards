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
    
    // We only need the file from this formdata
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    // Since we are proxying to the external web hook, it takes form-data with "file"
    const newFormData = new FormData();
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type || 'application/pdf' });
    newFormData.append('file', blob, file.name);

    console.log(`🚀 Forwarding PDF to AI Webhook: http://31.97.36.130:5678/webhook/form`);

    // Forward FormData to AI webhook
    const backendResponse = await fetch('http://31.97.36.130:5678/webhook/form', {
      method: 'POST',
      body: newFormData,
    });

    console.log('AI Webhook response status:', backendResponse.status);

    const responseText = await backendResponse.text();
    
    // Try to parse as JSON
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      console.error('❌ AI Webhook returned non-JSON response');
      return NextResponse.json(
        { 
          message: 'AI API error',
          details: responseText.substring(0, 500),
          status: backendResponse.status
        },
        { status: backendResponse.status }
      );
    }

    if (!backendResponse.ok) {
      console.error('❌ AI Webhook error:', result);
      return NextResponse.json(
        result || { message: 'Failed to extract exam' },
        { status: backendResponse.status }
      );
    }

    console.log('✅ AI extraction successful');
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('❌ AI extraction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}
