import { Buffer } from 'node:buffer';
import { NextRequest, NextResponse } from 'next/server';

const PDF_API_BASE_URL =
  process.env.PDF_API_BASE_URL || 'http://localhost:8000';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Файл илгээсэнгүй. "file" талбарт PDF илгээнэ үү.' },
        { status: 400 }
      );
    }

    if (
      ![
        'application/pdf',
        'application/x-pdf',
        'application/octet-stream',
      ].includes(file.type)
    ) {
      return NextResponse.json(
        { error: 'Зөвхөн PDF файлыг хүлээн авна.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const forwardForm = new FormData();
    forwardForm.append(
      'file',
      new Blob([buffer], { type: file.type || 'application/pdf' }),
      file.name || 'upload.pdf'
    );

    const targetUrl = `${PDF_API_BASE_URL.replace(/\/$/, '')}/extract`;
    const upstreamResponse = await fetch(targetUrl, {
      method: 'POST',
      body: forwardForm,
    });

    const isJson =
      upstreamResponse.headers.get('content-type')?.includes('application/json');
    const payload = isJson
      ? await upstreamResponse.json()
      : await upstreamResponse.text();

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        {
          error: 'PDF уншихад алдаа гарлаа.',
          details:
            typeof payload === 'string'
              ? payload
              : payload?.detail || payload?.error || 'Upstream error',
        },
        { status: upstreamResponse.status }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error('PDF extract proxy failed:', error);
    return NextResponse.json(
      { error: 'Алдаа гарлаа. Дахин оролдоно уу.' },
      { status: 500 }
    );
  }
}
