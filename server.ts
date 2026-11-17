import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const firebaseConfig = require('./firebase-applet-config.json') as {
  projectId: string;
  apiKey: string;
  firestoreDatabaseId: string;
};

const BOOTSTRAP_ADMIN_EMAIL = 'norassadra1388@gmail.com';
const PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = process.cwd();
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

interface IdentityLookupUser {
  localId?: string;
  email?: string;
  emailVerified?: boolean;
}

const adminTokenCache = new Map<string, { uid: string; email?: string; expiresAt: number }>();

async function verifyAdminFromToken(idToken: string): Promise<{ uid: string; email?: string } | null> {
  if (!idToken || !firebaseConfig.apiKey) return null;

  const cached = adminTokenCache.get(idToken);
  if (cached && cached.expiresAt > Date.now()) {
    return { uid: cached.uid, email: cached.email };
  }

  try {
    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!lookupRes.ok) return null;
    const lookupData = (await lookupRes.json()) as { users?: IdentityLookupUser[] };
    const authUser = lookupData.users?.[0];
    if (!authUser?.localId) return null;

    const normalizedEmail = (authUser.email || '').trim().toLowerCase();
    if (normalizedEmail === BOOTSTRAP_ADMIN_EMAIL && authUser.emailVerified === true) {
      const entry = { uid: authUser.localId, email: authUser.email };
      adminTokenCache.set(idToken, { ...entry, expiresAt: Date.now() + 5 * 60 * 1000 });
      return entry;
    }

    // Also allow admins explicitly granted inside Firestore `admins/{uid}`
    const dbId = encodeURIComponent(firebaseConfig.firestoreDatabaseId || '(default)');
    const projectId = encodeURIComponent(firebaseConfig.projectId);
    const uid = encodeURIComponent(authUser.localId);
    const adminDocRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/admins/${uid}`,
      {
        headers: { Authorization: `Bearer ${idToken}` },
      }
    );
    if (adminDocRes.ok) {
      const entry = { uid: authUser.localId, email: authUser.email };
      adminTokenCache.set(idToken, { ...entry, expiresAt: Date.now() + 5 * 60 * 1000 });
      return entry;
    }
    return null;
  } catch (err) {
    console.error('Admin verification error:', err);
    return null;
  }
}

function buildIceServersConfig() {
  const customStunUrl = (process.env.STUN_URL || '').trim();
  const defaultStunUrls = [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
    'stun:stun.cloudflare.com:3478',
    'stun:global.stun.twilio.com:3478',
  ];
  const parsedStunUrls = customStunUrl
    ? customStunUrl
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean)
    : [];
  const mergedStunUrls = Array.from(new Set([...parsedStunUrls, ...defaultStunUrls]));

  const iceServers: Array<{
    urls: string | string[];
    username?: string;
    credential?: string;
  }> = [
    {
      urls: mergedStunUrls,
    },
  ];

  const customTurnUrl = (process.env.TURN_URL || '').trim();
  const customTurnUser = (process.env.TURN_USERNAME || '').trim();
  const customTurnCred = (process.env.TURN_CREDENTIAL || '').trim();

  if (customTurnUrl) {
    const urls = customTurnUrl
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);
    if (urls.length > 0) {
      iceServers.push({
        urls,
        ...(customTurnUser ? { username: customTurnUser } : {}),
        ...(customTurnCred ? { credential: customTurnCred } : {}),
      });
    }
  }

  // Reachable TURN/TURNS relay servers (ports 80 & 443 UDP/TCP/TLS) for different ISPs / restrictive NATs
  iceServers.push(
    {
      urls: [
        'turn:global.relay.metered.ca:80',
        'turn:global.relay.metered.ca:443',
        'turn:global.relay.metered.ca:443?transport=tcp',
        'turns:global.relay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: [
        'turn:a.relay.metered.ca:80',
        'turn:a.relay.metered.ca:443',
        'turn:a.relay.metered.ca:443?transport=tcp',
        'turns:a.relay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    }
  );

  return {
    iceServers,
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle' as const,
    rtcpMuxPolicy: 'require' as const,
    hasCustomTurn: Boolean(customTurnUrl),
    hasCustomStun: parsedStunUrls.length > 0,
  };
}

interface RelayChunk {
  seq: number;
  data: Buffer;
}

interface RelayRoom {
  sessionId: string;
  mimeType: string;
  initChunk: Buffer | null;
  chunks: RelayChunk[];
  clients: Set<express.Response>;
  updatedAt: number;
}

const liveRelayRooms = new Map<string, RelayRoom>();

setInterval(() => {
  const cutoff = Date.now() - 15 * 60 * 1000;
  for (const [classId, room] of liveRelayRooms.entries()) {
    if (room.updatedAt < cutoff && room.clients.size === 0) {
      liveRelayRooms.delete(classId);
    }
  }
}, 5 * 60 * 1000).unref();

function broadcastRelayEvent(room: RelayRoom, eventPayload: Record<string, unknown>) {
  const encoded = `data: ${JSON.stringify(eventPayload)}\n\n`;
  for (const client of room.clients) {
    try {
      client.write(encoded);
    } catch {
      room.clients.delete(client);
    }
  }
}

async function startServer() {
  const app = express();

  // Provide dynamic ICE/TURN configuration for WebRTC cross-network traversal
  app.get('/api/rtc-config', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json(buildIceServersConfig());
  });

  // Express HTTPS Live Classroom Media Relay (guarantees playback across any ISP/CGNAT/firewall)
  app.post(
    '/api/live-relay/:classId/chunk',
    express.raw({ type: '*/*', limit: '4mb' }),
    async (req, res) => {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      const adminUser = token ? await verifyAdminFromToken(token) : null;
      if (!adminUser) {
        res.status(403).json({ error: 'Unauthorized live broadcaster' });
        return;
      }

      const classId = String(req.params.classId || '').replace(/[^a-zA-Z0-9_-]/g, '');
      const sessionId =
        typeof req.query.session === 'string'
          ? req.query.session.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)
          : '';
      const seq = Number(req.query.seq);
      const isInit = req.query.isInit === '1' || seq === 0;
      const mimeType =
        typeof req.query.mime === 'string' && req.query.mime.length <= 80
          ? req.query.mime
          : 'video/webm;codecs=vp8,opus';

      if (!classId || !sessionId || !Number.isFinite(seq) || seq < 0) {
        res.status(400).json({ error: 'Invalid chunk parameters' });
        return;
      }

      const bodyBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
      if (bodyBuffer.length === 0) {
        res.status(400).json({ error: 'Empty chunk' });
        return;
      }

      let room = liveRelayRooms.get(classId);
      if (!room || room.sessionId !== sessionId) {
        const prevClients = room?.clients ?? new Set<express.Response>();
        room = {
          sessionId,
          mimeType,
          initChunk: null,
          chunks: [],
          clients: prevClients,
          updatedAt: Date.now(),
        };
        liveRelayRooms.set(classId, room);
      }

      room.mimeType = mimeType;
      room.updatedAt = Date.now();
      if (isInit) {
        room.initChunk = bodyBuffer;
      }
      room.chunks.push({ seq, data: bodyBuffer });
      if (room.chunks.length > 10) {
        room.chunks.splice(0, room.chunks.length - 10);
      }

      broadcastRelayEvent(room, {
        type: 'chunk',
        sessionId: room.sessionId,
        seq,
        mimeType: room.mimeType,
        hasInit: Boolean(room.initChunk),
      });

      res.json({ ok: true, seq });
    }
  );

  app.post('/api/live-relay/:classId/stop', async (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const adminUser = token ? await verifyAdminFromToken(token) : null;
    if (!adminUser) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const classId = String(req.params.classId || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const room = liveRelayRooms.get(classId);
    if (room) {
      broadcastRelayEvent(room, { type: 'stopped', sessionId: room.sessionId });
      room.initChunk = null;
      room.chunks = [];
    }
    res.json({ ok: true });
  });

  app.get('/api/live-relay/:classId/events', (req, res) => {
    const classId = String(req.params.classId || '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!classId) {
      res.status(400).end();
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    let room = liveRelayRooms.get(classId);
    if (!room) {
      room = {
        sessionId: '',
        mimeType: '',
        initChunk: null,
        chunks: [],
        clients: new Set<express.Response>(),
        updatedAt: Date.now(),
      };
      liveRelayRooms.set(classId, room);
    }

    room.clients.add(res);
    res.write(
      `data: ${JSON.stringify({
        type: 'state',
        active: Boolean(room.sessionId && room.initChunk),
        sessionId: room.sessionId,
        mimeType: room.mimeType,
        hasInit: Boolean(room.initChunk),
        latestSeqs: room.chunks.map((c) => c.seq),
      })}\n\n`
    );

    const keepalive = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(keepalive);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(keepalive);
      liveRelayRooms.get(classId)?.clients.delete(res);
    });
  });

  app.get('/api/live-relay/:classId/chunk/:seq', (req, res) => {
    const classId = String(req.params.classId || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const room = liveRelayRooms.get(classId);
    if (!room) {
      res.status(404).end();
      return;
    }

    const reqSession = typeof req.query.session === 'string' ? req.query.session : '';
    if (reqSession && room.sessionId && reqSession !== room.sessionId) {
      res.status(409).end();
      return;
    }

    const seqParam = req.params.seq;
    let payload: Buffer | null = null;
    if (seqParam === 'init') {
      payload = room.initChunk;
    } else {
      const seqNum = Number(seqParam);
      payload = room.chunks.find((c) => c.seq === seqNum)?.data ?? null;
    }

    if (!payload) {
      res.status(404).end();
      return;
    }

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(payload);
  });

  // Streaming file upload endpoint for Admin offline lesson videos and PDF booklets
  app.post('/api/upload', async (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
      res.status(401).json({ error: 'برای بارگذاری فایل ابتدا با حساب مدیریت وارد شوید.' });
      return;
    }

    const adminUser = await verifyAdminFromToken(token);
    if (!adminUser) {
      res.status(403).json({ error: 'فقط مدیر سیستم مجاز به بارگذاری فایل دوره و جزوه است.' });
      return;
    }

    const rawKind = typeof req.query.kind === 'string' ? req.query.kind : '';
    const kind = rawKind === 'video' || rawKind === 'pdf' ? rawKind : null;
    if (!kind) {
      res.status(400).json({ error: 'نوع فایل باید video یا pdf باشد.' });
      return;
    }

    const rawFilename =
      typeof req.query.filename === 'string' ? req.query.filename : `${kind}.${kind === 'pdf' ? 'pdf' : 'mp4'}`;
    const ext = path.extname(path.basename(rawFilename)).toLowerCase();

    const allowedVideoExt = ['.mp4', '.webm', '.mov', '.m4v', '.mkv', '.ogg'];
    if (kind === 'pdf' && ext !== '.pdf') {
      res.status(400).json({ error: 'فقط فایل با پسوند استاندارد .pdf برای جزوه مجاز است.' });
      return;
    }
    if (kind === 'video' && !allowedVideoExt.includes(ext)) {
      res.status(400).json({
        error: 'فرمت ویدیو پشتیبانی نمی‌شود. از MP4، WebM، MOV یا M4V استفاده کنید.',
      });
      return;
    }

    const maxBytes = kind === 'video' ? 250 * 1024 * 1024 : 60 * 1024 * 1024;
    const baseName = path
      .basename(rawFilename, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48);
    const safeFileName = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${baseName ? `-${baseName}` : ''}${ext}`;
    const targetPath = path.join(UPLOADS_DIR, safeFileName);

    let bytes = 0;
    let aborted = false;
    const writeStream = fs.createWriteStream(targetPath);

    const cleanupPartial = () => {
      try {
        writeStream.destroy();
        if (fs.existsSync(targetPath)) {
          fs.unlinkSync(targetPath);
        }
      } catch {
        // ignore cleanup error
      }
    };

    req.on('data', (chunk: Buffer) => {
      if (aborted) return;
      bytes += chunk.length;
      if (bytes > maxBytes) {
        aborted = true;
        cleanupPartial();
        if (!res.headersSent) {
          res.status(413).json({
            error:
              kind === 'video'
                ? 'حجم فایل ویدیو بیش از حد مجاز (۲۵۰ مگابایت) است.'
                : 'حجم فایل PDF بیش از حد مجاز (۶۰ مگابایت) است.',
          });
        }
        req.destroy();
        return;
      }
      if (!writeStream.write(chunk)) {
        req.pause();
        writeStream.once('drain', () => req.resume());
      }
    });

    req.on('end', () => {
      if (aborted) return;
      if (bytes === 0) {
        cleanupPartial();
        if (!res.headersSent) {
          res.status(400).json({ error: 'فایل انتخاب‌شده خالی است.' });
        }
        return;
      }
      writeStream.end(() => {
        if (!res.headersSent) {
          res.json({
            url: `/uploads/${safeFileName}`,
            fileName: safeFileName,
            bytes,
          });
        }
      });
    });

    req.on('error', () => {
      aborted = true;
      cleanupPartial();
      if (!res.headersSent) {
        res.status(500).json({ error: 'خطا در دریافت فایل از مرورگر.' });
      }
    });

    writeStream.on('error', () => {
      aborted = true;
      cleanupPartial();
      if (!res.headersSent) {
        res.status(500).json({ error: 'خطا در ذخیره فایل روی سرور.' });
      }
    });
  });

  // Serve uploaded course videos & PDF booklets with HTTP Range request support
  app.use(
    '/uploads',
    express.static(UPLOADS_DIR, {
      acceptRanges: true,
      maxAge: '7d',
      setHeaders: (res, filePath) => {
        if (filePath.toLowerCase().endsWith('.pdf')) {
          res.setHeader('Content-Type', 'application/pdf');
        }
      },
    })
  );

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(ROOT_DIR, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Biomaze full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
