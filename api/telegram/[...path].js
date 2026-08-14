export default async function handler(req, res) {
  try {
    const urlParts = req.url.split('/api/telegram/');
    const cleanPath = urlParts.length > 1 ? urlParts[1].split('?')[0] : '';

    if (!cleanPath) {
      return res.status(400).json({
        ok: false,
        description: 'مسیر نامعتبر است. باید چیزی شبیه /api/telegram/bot{TOKEN}/{METHOD} باشد.',
      });
    }

    const targetUrl = `https://api.telegram.org/${cleanPath}`;

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
