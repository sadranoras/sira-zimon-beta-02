export interface ResolvedVideoSource {
  kind: 'native' | 'iframe' | 'external';
  src: string;
  originalUrl: string;
}

export function resolveLessonVideoSource(rawUrl?: string): ResolvedVideoSource | null {
  const url = (rawUrl || '').trim();
  if (!url) return null;

  // Direct video stream or file
  if (
    /\.(mp4|webm|ogg|m4v|mov|mkv)(\?.*)?$/i.test(url) ||
    url.startsWith('blob:') ||
    url.startsWith('data:video/')
  ) {
    return { kind: 'native', src: url, originalUrl: url };
  }

  // Aparat video (e.g. https://www.aparat.com/v/abc123)
  const aparatMatch = url.match(/aparat\.com\/v\/([a-zA-Z0-9_-]+)/i);
  if (aparatMatch?.[1]) {
    return {
      kind: 'iframe',
      src: `https://www.aparat.com/video/video/embed/videohash/${aparatMatch[1]}/vt/frame`,
      originalUrl: url,
    };
  }

  // YouTube watch / short / embed
  const ytWatchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{6,})/);
  if (ytWatchMatch?.[1]) {
    return {
      kind: 'iframe',
      src: `https://www.youtube.com/embed/${ytWatchMatch[1]}`,
      originalUrl: url,
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch?.[1]) {
    return {
      kind: 'iframe',
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      originalUrl: url,
    };
  }

  // Already an embed iframe URL
  if (/embed|player\./i.test(url)) {
    return { kind: 'iframe', src: url, originalUrl: url };
  }

  return { kind: 'external', src: url, originalUrl: url };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function downloadOfflineLessonBooklet(params: {
  courseTitle: string;
  instructor: string;
  lessonOrder: number;
  lessonTitle: string;
  bookletTitle: string;
  videoTopic: string;
  keyPoints: string;
}): void {
  const safePoints = escapeHtml(params.keyPoints).replace(/\n/g, '<br />');
  const html = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(params.bookletTitle)}</title>
  <style>
    body {
      font-family: Tahoma, Vazirmatn, Arial, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      margin: 0;
      padding: 32px;
      line-height: 1.9;
    }
    .sheet {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 16px;
      padding: 32px;
    }
    .meta {
      font-size: 13px;
      color: #047857;
      font-weight: bold;
      margin-bottom: 8px;
    }
    h1 {
      font-size: 22px;
      margin: 0 0 8px 0;
    }
    .sub {
      font-size: 14px;
      color: #475569;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e2e8f0;
    }
    .topic {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 14px;
      margin-bottom: 20px;
    }
    .notes {
      font-size: 15px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 18px 20px;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .sheet { border: none; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="meta">زیست‌ماز · جزوه آفلاین جلسه ${params.lessonOrder}</div>
    <h1>${escapeHtml(params.bookletTitle)}</h1>
    <div class="sub">${escapeHtml(params.courseTitle)} · مدرس: ${escapeHtml(params.instructor)} · ${escapeHtml(params.lessonTitle)}</div>
    <div class="topic"><strong>محور تدریس جلسه:</strong> ${escapeHtml(params.videoTopic)}</div>
    <div class="notes">${safePoints}</div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `biomaze-session-${params.lessonOrder}-booklet.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function uploadCourseMediaFile(
  file: File,
  kind: 'video' | 'pdf',
  idToken: string,
  onProgress?: (percent: number) => void
): Promise<{ url: string; fileName: string; bytes: number }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const qs = new URLSearchParams({
      kind,
      filename: file.name || (kind === 'pdf' ? 'booklet.pdf' : 'lesson.mp4'),
    });
    xhr.open('POST', `/api/upload?${qs.toString()}`);
    if (idToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${idToken}`);
    }
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && onProgress) {
        onProgress(Math.min(99, Math.round((ev.loaded / ev.total) * 100)));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const parsed = JSON.parse(xhr.responseText) as {
            url: string;
            fileName: string;
            bytes: number;
          };
          onProgress?.(100);
          resolve(parsed);
        } catch {
          reject(new Error('پاسخ نامعتبر از سرور بارگذاری'));
        }
      } else {
        try {
          const errJson = JSON.parse(xhr.responseText) as { error?: string };
          reject(new Error(errJson.error || `خطا در بارگذاری فایل (کد ${xhr.status})`));
        } catch {
          reject(new Error(`خطا در بارگذاری فایل (کد ${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('خطای شبکه هنگام ارسال فایل به سرور'));
    xhr.send(file);
  });
}
