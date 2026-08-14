// این فایل یک «پروکسی» ساده است: هر درخواستی که به آن برسد را عیناً به
// api.telegram.org می‌فرستد و جواب تلگرام را بدون تغییر برمی‌گرداند.
// چون این فایل روی سرورهای Vercel (خارج از ایران) اجرا می‌شود، محدودیت
// دسترسی مستقیم ایران به تلگرام را دور می‌زند.
//
// آدرس این تابع بعد از دیپلوی، این شکلی خواهد بود:
//   https://YOUR-PROJECT.vercel.app/api/telegram/{هر چیزی}
//
// و هر چیزی که بعد از /api/telegram/ بیاید، مستقیم به همان مسیر در
// api.telegram.org فوروارد می‌شود. مثلاً:
//   .../api/telegram/bot123456:ABC/getMe
//   -> فوروارد می‌شود به -> https://api.telegram.org/bot123456:ABC/getMe

export default async function handler(req, res) {
  try {
    // مسیر باقی‌مانده بعد از /api/telegram/ را می‌گیریم (مثلاً "bot123:ABC/getMe")
    const segments = req.query.path;

    if (!segments || segments.length === 0) {
      res.status(400).json({
        ok: false,
        description: 'مسیر نامعتبر است. باید چیزی شبیه /api/telegram/bot{TOKEN}/{METHOD} باشد.',
      });
      return;
    }

    const targetPath = Array.isArray(segments) ? segments.join('/') : segments;
    const targetUrl = `https://api.telegram.org/${targetPath}`;

    // خواندن بدنه‌ی خام درخواست (برای متدهای POST که تلگرام استفاده می‌کند)
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks);

    const upstreamResponse = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : rawBody,
    });

    const responseText = await upstreamResponse.text();

    res.status(upstreamResponse.status);
    res.setHeader('Content-Type', upstreamResponse.headers.get('content-type') || 'application/json');
    res.send(responseText);
  } catch (error) {
    res.status(502).json({
      ok: false,
      description: 'خطای پروکسی: ' + error.message,
    });
  }
}
