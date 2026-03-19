const express = require('express');
const path = require('path');
const compression = require('compression');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Gzip compression
app.use(compression());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '10kb' }));

// Static files with caching
app.use(express.static(path.join(__dirname), {
  maxAge: '7d',
  etag: true,
  lastModified: true,
  setHeaders(res, filePath) {
    // HTML — no cache (always fresh)
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
    // CSS/JS — cache with revalidation
    else if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
      res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
    }
  }
}));

// Telegram config
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const serviceNames = {
  plumbing: 'Сантехника',
  electric: 'Электрика',
  mounting: 'Навеска и монтаж',
  doors: 'Двери и замки',
  other: 'Другое',
};

// Rate limiting (simple in-memory)
const rateMap = new Map();
const RATE_LIMIT = 5; // max requests per minute per IP

function checkRate(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.start > 60000) {
    rateMap.set(ip, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

// Cleanup old rate entries every 5 min
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateMap) {
    if (now - entry.start > 120000) rateMap.delete(ip);
  }
}, 300000);

app.post('/api/order', async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  if (!checkRate(ip)) {
    return res.status(429).json({ error: 'Слишком много запросов. Подождите минуту.' });
  }

  const { name, phone, service, comment } = req.body;

  if (!name || !phone || !service) {
    return res.status(400).json({ error: 'Заполните обязательные поля' });
  }

  // Basic sanitization
  const clean = (s) => String(s).slice(0, 200).replace(/[<>]/g, '');
  const safeName = clean(name);
  const safePhone = clean(phone);
  const safeComment = comment ? clean(comment) : '';

  const serviceName = serviceNames[service] || clean(service);

  const message =
    `🔔 *Новая заявка с сайта*\n\n` +
    `👤 *Имя:* ${safeName}\n` +
    `📞 *Телефон:* ${safePhone}\n` +
    `🔧 *Услуга:* ${serviceName}\n` +
    (safeComment ? `💬 *Комментарий:* ${safeComment}\n` : '') +
    `\n🕐 ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`;

  try {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.log('Telegram not configured. Order:', { safeName, safePhone, serviceName, safeComment });
      return res.json({ success: true });
    }

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown',
        }),
      }
    );

    if (!response.ok) {
      console.error('Telegram API error:', await response.text());
      return res.status(500).json({ error: 'Ошибка отправки' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Telegram error:', error.message);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
