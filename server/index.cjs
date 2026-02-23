const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');
const os = require('os');
const multer = require('multer');
const { parseOffice } = require('officeparser');

// .env.local を読み込む（既存の環境変数は上書きしない）
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length > 0 && !process.env[key.trim()]) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  }
}

const jsonServer = require('json-server');

const app = express();
// API_PORT を優先、なければ PORT（ただし Vite が PORT を使う場合があるため API_PORT 推奨）
const PORT = process.env.API_PORT || process.env.PORT || 3001;
const DB_FILE = process.env.DB_FILE || 'db.json';
const INSTANCE_LANG = process.env.INSTANCE_LANG || 'ja';
const dbPath = path.join(__dirname, '..', DB_FILE);

app.use(cors());

// Gemini API プロキシ
app.post('/gemini', express.json({ limit: '10mb' }), (req, res) => {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_API_KEY が設定されていません。.env.local を確認してください。' });
  }

  const { model = 'gemini-2.0-flash', ...bodyWithoutModel } = req.body;
  const body = JSON.stringify(bodyWithoutModel);
  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => { data += chunk; });
    proxyRes.on('end', () => {
      res.status(proxyRes.statusCode).set('Content-Type', 'application/json').send(data);
    });
  });

  proxyReq.on('error', (err) => {
    console.error('Gemini API エラー:', err);
    res.status(500).json({ error: err.message });
  });

  proxyReq.write(body);
  proxyReq.end();
});

// ファイル解析エンドポイント（PPTX / DOCX / XLSX → テキスト抽出）
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

app.post('/parse-file', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'ファイルが見つかりません' });
  }
  const tmpPath = req.file.path;
  const cleanup = () => fs.unlink(tmpPath, () => {});

  parseOffice(tmpPath, (err, text) => {
    if (err) {
      cleanup();
      return res.status(500).json({ error: `ファイルの解析に失敗しました: ${err.message || err}` });
    }
    cleanup();
    res.json({ text: text || '', filename: req.file.originalname });
  }, { outputErrorToConsole: false });
});

// クロスラング読み取りAPI（読み取り専用・他インスタンスからのアクセス用）
app.get('/cross-lang/cards', express.json(), (req, res) => {
  try {
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    res.json({ lang: INSTANCE_LANG, cards: db.cards ?? [] });
  } catch (err) {
    res.status(500).json({ error: 'Could not read DB', detail: String(err) });
  }
});

// json-server ミドルウェアのセットアップ
const router = jsonServer.router(dbPath);
const middlewares = jsonServer.defaults({ nolog: true });
app.use('/api', middlewares, router);

app.listen(PORT, () => {
  console.log(`\n文脈コレクション サーバー起動中 → http://localhost:${PORT}`);
  console.log(`  Lang: ${INSTANCE_LANG.toUpperCase()} | DB: ${dbPath}`);
  console.log(`  Gemini API: ${process.env.GOOGLE_API_KEY ? '設定済み' : '未設定 (.env.local を確認)'}\n`);
});
