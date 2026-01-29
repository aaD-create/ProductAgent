import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import 'dotenv/config';

const app = express();

// ---- Configuration ----
const PORT = process.env.PORT || 3000;
const DIRECT_LINE_SECRET = process.env.DIRECT_LINE_SECRET;
const DIRECT_LINE_BASE_URL = (process.env.DIRECT_LINE_BASE_URL || 'https://directline.botframework.com').replace(/\/$/, '');
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

if (!DIRECT_LINE_SECRET) {
  console.error('Missing DIRECT_LINE_SECRET. Set it in environment variables.');
  process.exit(1);
}

// ---- Security middleware ----
app.use(helmet({
  // If you embed this page inside an iframe, adjust frameguard/CSP accordingly.
  contentSecurityPolicy: false
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '64kb' }));

// Rate-limit only API routes (token minting) to avoid abuse.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
});

// CORS: for same-origin hosting, you can keep this disabled.
// If you host frontend separately, set ALLOWED_ORIGINS.
app.use('/api', cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // server-to-server or curl
    if (ALLOWED_ORIGINS.length === 0) return callback(null, true);
    return ALLOWED_ORIGINS.includes(origin) ? callback(null, true) : callback(new Error('Not allowed by CORS'));
  },
  credentials: false
}));

// ---- Static frontend ----
app.use('/', express.static(new URL('./public', import.meta.url).pathname));

// ---- Direct Line token endpoint ----
// Why: Never expose Direct Line secret to the browser.
// Browser calls /api/directline/token; server exchanges secret for short-lived token.
app.get('/api/directline/token', apiLimiter, async (req, res) => {
  try {
    const tokenUrl = `${DIRECT_LINE_BASE_URL}/v3/directline/tokens/generate`;

    const r = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIRECT_LINE_SECRET}`
      }
    });

    if (!r.ok) {
      const body = await r.text();
      return res.status(502).json({ error: 'Failed to generate Direct Line token', status: r.status, details: body });
    }

    const json = await r.json();
    // Return only what browser needs.
    return res.json({ token: json.token, expires_in: json.expires_in, conversationId: json.conversationId });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Unexpected error generating token' });
  }
});

// Health check
app.get('/healthz', (req, res) => res.status(200).send('ok'));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Using Direct Line base: ${DIRECT_LINE_BASE_URL}`);
});
