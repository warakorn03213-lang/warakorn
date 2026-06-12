const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('./database');

const app = express();
const PORT = 5000;

// Security Item 4: JWT_SECRET environment check
const JWT_SECRET_ENV = process.env.JWT_SECRET;
if (!JWT_SECRET_ENV) {
  if (process.env.NODE_ENV === 'production') {
    console.error('CRITICAL ERROR: JWT_SECRET environment variable is NOT set in production!');
    process.exit(1);
  } else {
    console.warn('WARNING: JWT_SECRET environment variable is not set. Using fallback development key.');
  }
}
const JWT_SECRET = JWT_SECRET_ENV || 'bluefolio-super-secret-key-12345';

// Security Item 2: API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'มีการเชื่อมต่อมากเกินไป กรุณาลองใหม่อีกครั้งในภายหลัง' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login/register requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'พยายามเข้าสู่ระบบหรือลงทะเบียนบ่อยเกินไป กรุณาลองใหม่อีกครั้งในภายหลัง (15 นาที)' }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Apply Rate Limiters
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
// Security Item 1: Restrict File Upload types and size
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.mp4', '.webm', '.pdf', '.zip', '.txt'];
const ALLOWED_MIME_TYPES = [
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm',
  'application/pdf', 'application/zip', 'text/plain'
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;
  
  if (ALLOWED_EXTENSIONS.includes(ext) && ALLOWED_MIME_TYPES.includes(mime)) {
    cb(null, true);
  } else {
    cb(new Error('ประเภทไฟล์ไม่ได้รับอนุญาตให้ใช้ในการอัปโหลด'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter
});

app.use('/uploads', express.static(uploadsDir));

// Database promise wrappers for cleaner async/await code flow
const dbQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// --- AUTHENTICATION MIDDLEWARE ---

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'เซสชันหมดอายุหรือไม่มีสิทธิ์การใช้งาน กรุณาเข้าสู่ระบบใหม่' });
    }
    req.user = decoded;
    next();
  });
};

// --- AUTHENTICATION ---

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  try {
    const existingUser = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'อีเมลนี้เคยลงทะเบียนไว้แล้ว' });
    }

    // Generate consecutive USRxx serial ID based on highest existing ID
    const maxRow = await dbGet("SELECT userId FROM users WHERE userId LIKE 'USR%' ORDER BY userId DESC LIMIT 1");
    const nextNum = maxRow ? parseInt(maxRow.userId.replace('USR', ''), 10) + 1 : 1;
    const userId = `USR${String(nextNum).padStart(2, '0')}`;

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    await dbRun(
      'INSERT INTO users (email, password, name, userId, role, avatar) VALUES (?, ?, ?, ?, ?, ?)',
      [email.trim(), hashedPassword, name.trim(), userId, 'creator', '']
    );

    const newUser = await dbGet('SELECT email, name, userId, role, avatar, bio, socialLink FROM users WHERE email = ?', [email]);
    res.json({ ...newUser, following: [] });
  } catch (err) {
    res.status(500).json({ error: 'ระบบทำงานขัดข้อง กรุณาลองใหม่อีกครั้ง' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  try {
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email.trim()]);
    if (!user) {
      return res.status(400).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const isPasswordValid = await bcrypt.compare(password.trim(), user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const follows = await dbQuery('SELECT followedEmail FROM follows WHERE followerEmail = ?', [email]);
    const following = follows.map(f => f.followedEmail);

    const token = jwt.sign(
      { email: user.email, name: user.name, role: user.role, userId: user.userId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    delete user.password; // Do not send password to the client
    res.json({ ...user, following, token });
  } catch (err) {
    res.status(500).json({ error: 'ระบบทำงานขัดข้อง' });
  }
});

app.post('/api/auth/create-admin', authenticateToken, async (req, res) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบระดับสูง (Super Admin) เท่านั้นที่ดำเนินการได้' });
  }

  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  try {
    const existing = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานในระบบแล้ว' });
    }

    const maxRow = await dbGet("SELECT userId FROM users WHERE userId LIKE 'ADM%' ORDER BY userId DESC LIMIT 1");
    const nextNum = maxRow ? parseInt(maxRow.userId.replace('ADM', ''), 10) + 1 : 1;
    const userId = `ADM${String(nextNum).padStart(2, '0')}`;

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    await dbRun(
      'INSERT INTO users (email, password, name, userId, role, avatar) VALUES (?, ?, ?, ?, ?, ?)',
      [email.trim(), hashedPassword, name.trim(), userId, 'admin', '']
    );

    const newAdmin = await dbGet('SELECT email, name, userId, role, avatar FROM users WHERE email = ?', [email]);
    res.json(newAdmin);
  } catch (err) {
    res.status(500).json({ error: 'ระบบขัดข้อง' });
  }
});

// --- USERS MANAGEMENT ---

app.get('/api/users', async (req, res) => {
  try {
    const users = await dbQuery('SELECT email, name, userId, role, avatar, bio, socialLink, isSuspended FROM users');
    const formatted = users.map(u => ({ ...u, isSuspended: !!u.isSuspended }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'ระบบขัดข้อง' });
  }
});

app.put('/api/users/profile', authenticateToken, upload.single('avatarFile'), async (req, res) => {
  const { email, name, bio, socialLink, avatarUrl } = req.body;
  if (req.user.email !== email && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'คุณไม่มีสิทธิ์อัปเดตข้อมูลของบุคคลอื่น' });
  }

  try {
    let finalAvatar = avatarUrl || '';
    if (req.file) {
      finalAvatar = `/uploads/${req.file.filename}`;
    }

    await dbRun(
      'UPDATE users SET name = ?, bio = ?, socialLink = ?, avatar = ? WHERE email = ?',
      [name.trim(), bio ? bio.trim() : '', socialLink ? socialLink.trim() : '', finalAvatar, email]
    );

    const updated = await dbGet('SELECT email, name, userId, role, avatar, bio, socialLink FROM users WHERE email = ?', [email]);
    res.json(updated);
  } catch (err) {
    console.error('Error in PUT /api/users/profile:', err);
    res.status(500).json({ error: 'ระบบขัดข้อง: ' + err.message });
  }
});

app.delete('/api/users/:email', authenticateToken, async (req, res) => {
  const { email } = req.params;
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบระดับสูง (Super Admin) เท่านั้นที่สามารถลบบัญชีผู้ใช้ได้' });
  }
  if (req.user.email === email) {
    return res.status(400).json({ error: 'คุณไม่สามารถลบบัญชีของตัวเองได้' });
  }

  try {
    // SQLite foreign keys are enabled (cascade delete will handle related projects/comments/likes)
    await dbRun('DELETE FROM users WHERE email = ?', [email]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'ระบบขัดข้อง' });
  }
});

app.put('/api/users/:email/suspend', authenticateToken, async (req, res) => {
  const { email } = req.params;
  const { isSuspended } = req.body;
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบระดับสูง (Super Admin) เท่านั้นที่สามารถระงับบัญชีผู้ใช้ได้' });
  }
  try {
    await dbRun('UPDATE users SET isSuspended = ? WHERE email = ?', [isSuspended ? 1 : 0, email]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'ระบบขัดข้อง' });
  }
});

app.get('/api/users/:email/following', async (req, res) => {
  const { email } = req.params;
  try {
    const follows = await dbQuery('SELECT followedEmail FROM follows WHERE followerEmail = ?', [email]);
    const following = follows.map(f => f.followedEmail);
    res.json({ following });
  } catch (err) {
    res.status(500).json({ error: 'ระบบขัดข้อง' });
  }
});

// --- PROJECTS / PORTFOLIO ---

app.get('/api/projects', async (req, res) => {
  try {
    const projects = await dbQuery(`
      SELECT p.*, u.name as authorName, u.avatar as authorAvatar
      FROM projects p
      JOIN users u ON p.authorEmail = u.email
      ORDER BY p.id DESC
    `);

    // Attach comments and likes to each project row asynchronously
    const enrichedProjects = await Promise.all(
      projects.map(async (p) => {
        const likesRows = await dbQuery('SELECT userEmail FROM likes WHERE projectId = ?', [p.id]);
        const likes = likesRows.map(r => r.userEmail);

        const comments = await dbQuery('SELECT * FROM comments WHERE projectId = ? ORDER BY id ASC', [p.id]);

        return {
          ...p,
          isSuspended: !!p.isSuspended,
          likes,
          comments
        };
      })
    );

    res.json(enrichedProjects);
  } catch (err) {
    res.status(500).json({ error: 'ระบบขัดข้อง' });
  }
});

app.post('/api/projects', authenticateToken, upload.single('mediaFile'), async (req, res) => {
  const { title, description, type, tags, authorEmail, fileUrl: externalUrl } = req.body;
  if (req.user.email !== authorEmail) {
    return res.status(403).json({ error: 'ไม่สามารถเพิ่มผลงานในนามของผู้อื่นได้' });
  }

  try {
    let finalFileUrl = externalUrl || '';
    let fileName = '';
    let fileSize = '';

    if (req.file) {
      finalFileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
      const sizeInMB = (req.file.size / (1024 * 1024)).toFixed(2);
      fileSize = `${sizeInMB} MB`;
    } else if (externalUrl) {
      try {
        const parsed = new URL(externalUrl);
        const parts = parsed.pathname.split('/');
        fileName = parts[parts.length - 1] || 'external-link';
      } catch {
        fileName = 'external-link';
      }
      fileSize = 'External URL';
    }

    const dateStr = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const projectId = Date.now();

    await dbRun(
      'INSERT INTO projects (id, title, description, type, fileUrl, fileName, fileSize, date, tags, authorEmail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [projectId, title.trim(), description ? description.trim() : '', type, finalFileUrl, fileName, fileSize, dateStr, tags || '', authorEmail]
    );

    res.json({ success: true, id: projectId });
  } catch (err) {
    res.status(500).json({ error: 'ระบบขัดข้อง' });
  }
});

app.put('/api/projects/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, tags } = req.body;

  try {
    const project = await dbGet('SELECT authorEmail FROM projects WHERE id = ?', [id]);
    if (!project) {
      return res.status(404).json({ error: 'ไม่พบผลงานนี้ในระบบ' });
    }
    if (req.user.email !== project.authorEmail && req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์แก้ไขผลงานของผู้อื่น' });
    }

    await dbRun(
      'UPDATE projects SET title = ?, description = ?, tags = ? WHERE id = ?',
      [title.trim(), description ? description.trim() : '', tags || '', id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'ระบบขัดข้อง' });
  }
});

app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถลบผลงานได้' });
  }
  try {
    await dbRun('DELETE FROM projects WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'ระบบขัดข้อง' });
  }
});

app.put('/api/projects/:id/suspend', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { isSuspended } = req.body;
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถระงับโพสต์ผลงานได้' });
  }
  try {
    await dbRun('UPDATE projects SET isSuspended = ? WHERE id = ?', [isSuspended ? 1 : 0, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'ระบบขัดข้อง' });
  }
});

// --- LIKES & COMMENTS & FOLLOWS ---

app.post('/api/projects/:id/like', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  if (req.user.email !== email) {
    return res.status(403).json({ error: 'สิทธิ์การใช้งานไม่ถูกต้อง' });
  }

  try {
    const existing = await dbGet('SELECT * FROM likes WHERE userEmail = ? AND projectId = ?', [email, id]);
    if (existing) {
      await dbRun('DELETE FROM likes WHERE userEmail = ? AND projectId = ?', [email, id]);
    } else {
      await dbRun('INSERT INTO likes (userEmail, projectId) VALUES (?, ?)', [email, id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'ระบบขัดข้อง' });
  }
});

app.post('/api/projects/:id/comments', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { authorEmail, authorName, text } = req.body;
  if (req.user.email !== authorEmail) {
    return res.status(403).json({ error: 'สิทธิ์การใช้งานไม่ถูกต้อง' });
  }

  const dateStr = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const commentId = Date.now();

  try {
    await dbRun(
      'INSERT INTO comments (id, projectId, authorEmail, authorName, text, date) VALUES (?, ?, ?, ?, ?, ?)',
      [commentId, id, authorEmail, authorName, text.trim(), dateStr]
    );

    res.json({ id: commentId, projectId: Number(id), authorEmail, authorName, text, date: dateStr });
  } catch (err) {
    res.status(500).json({ error: 'ระบบขัดข้อง' });
  }
});

app.delete('/api/projects/:projectId/comments/:commentId', authenticateToken, async (req, res) => {
  const { commentId } = req.params;
  try {
    const comment = await dbGet('SELECT authorEmail FROM comments WHERE id = ?', [commentId]);
    if (!comment) {
      return res.status(404).json({ error: 'ไม่พบความคิดเห็นนี้' });
    }
    if (req.user.email !== comment.authorEmail && req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์ลบความคิดเห็นของบุคคลอื่น' });
    }

    await dbRun('DELETE FROM comments WHERE id = ?', [commentId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'ระบบขัดข้อง' });
  }
});

app.post('/api/users/follow', authenticateToken, async (req, res) => {
  const { followerEmail, followedEmail } = req.body;
  if (req.user.email !== followerEmail) {
    return res.status(403).json({ error: 'สิทธิ์การใช้งานไม่ถูกต้อง' });
  }
  if (followerEmail === followedEmail) {
    return res.status(400).json({ error: 'ไม่สามารถติดตามตนเองได้' });
  }

  try {
    const existing = await dbGet('SELECT * FROM follows WHERE followerEmail = ? AND followedEmail = ?', [followerEmail, followedEmail]);
    if (existing) {
      await dbRun('DELETE FROM follows WHERE followerEmail = ? AND followedEmail = ?', [followerEmail, followedEmail]);
    } else {
      await dbRun('INSERT INTO follows (followerEmail, followedEmail) VALUES (?, ?)', [followerEmail, followedEmail]);
    }

    const follows = await dbQuery('SELECT followedEmail FROM follows WHERE followerEmail = ?', [followerEmail]);
    const following = follows.map(f => f.followedEmail);

    res.json({ following });
  } catch (err) {
    res.status(500).json({ error: 'ระบบขัดข้อง' });
  }
});

// Global error handling middleware (handles multer and other unhandled errors)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'ขนาดไฟล์อัปโหลดเกินขีดจำกัดสูงสุด 10MB' });
    }
    return res.status(400).json({ error: 'ข้อผิดพลาดในการอัปโหลดไฟล์: ' + err.message });
  }
  if (err.message === 'ประเภทไฟล์ไม่ได้รับอนุญาตให้ใช้ในการอัปโหลด') {
    return res.status(400).json({ error: err.message });
  }
  
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในระบบเซิร์ฟเวอร์' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
