const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { dbQuery, dbGet, dbRun, isPg, dbInitPromise } = require('./database');
const { createClient } = require('@supabase/supabase-js');

let supabase = null;
if (isPg && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'bluefolio';

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

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: [frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Ensure database is fully initialized before handling API requests (fixes Vercel Serverless race conditions)
app.use(async (req, res, next) => {
  try {
    await dbInitPromise;
    next();
  } catch (err) {
    console.error('Database initialization failed:', err);
    res.status(500).json({ error: 'ฐานข้อมูลยังไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้งในภายหลัง' });
  }
});

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

// Multer dual storage setup split by upload type (Avatar vs Project)
let uploadAvatar;
let uploadProject;

if (isPg) {
  uploadAvatar = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit for profile avatar
    },
    fileFilter
  });

  uploadProject = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 100 * 1024 * 1024 // 100MB limit for project files/videos
    },
    fileFilter
  });
} else {
  uploadAvatar = multer({
    storage,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter
  });

  uploadProject = multer({
    storage,
    limits: {
      fileSize: 100 * 1024 * 1024 // 100MB limit
    },
    fileFilter
  });
}

const uploadToCloudOrLocal = async (file, fallbackFilename) => {
  if (isPg && supabase) {
    const fileExt = path.extname(file.originalname);
    const fileNameKey = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileNameKey, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error('ไม่สามารถอัปโหลดไฟล์ไปยังระบบคลาวด์ได้');
    }
    
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileNameKey);
      
    return publicUrlData.publicUrl;
  } else {
    return `/uploads/${fallbackFilename}`;
  }
};

const deleteUploadedFile = async (fileUrl) => {
  if (!fileUrl) return;
  try {
    if (isPg && supabase && fileUrl.includes('supabase.co')) {
      let filenameKey = null;
      let usedBucketName = BUCKET_NAME;
      
      if (fileUrl.includes('portfolio-uploads/')) {
        filenameKey = fileUrl.split('portfolio-uploads/')[1];
        usedBucketName = 'portfolio-uploads';
      } else if (fileUrl.includes(`${BUCKET_NAME}/`)) {
        filenameKey = fileUrl.split(`${BUCKET_NAME}/`)[1];
      }
      
      if (filenameKey) {
        const { error } = await supabase.storage
          .from(usedBucketName)
          .remove([filenameKey]);
        if (error) {
          console.error('Failed to delete file from Supabase storage:', error);
        } else {
          console.log(`Deleted file from Supabase storage: ${filenameKey} from bucket ${usedBucketName}`);
        }
      }
    } else if (fileUrl.startsWith('/uploads/')) {
      const filename = fileUrl.replace('/uploads/', '');
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted local file: ${filename}`);
      }
    }
  } catch (err) {
    console.error('Error in deleteUploadedFile:', err);
  }
};

app.use('/uploads', express.static(uploadsDir));

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

    const trimmedEmail = email.trim();
    await dbRun(
      'INSERT INTO users (email, password, name, userId, role, avatar) VALUES (?, ?, ?, ?, ?, ?)',
      [trimmedEmail, hashedPassword, name.trim(), userId, 'creator', '']
    );

    const newUser = await dbGet('SELECT email, name, userId, role, avatar, bio, socialLink FROM users WHERE email = ?', [trimmedEmail]);
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

    const follows = await dbQuery('SELECT followedEmail FROM follows WHERE followerEmail = ?', [user.email]);
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

// Public endpoint: returns limited user data for explore feed (no role, no isSuspended)
app.get('/api/users/public', async (req, res) => {
  try {
    const users = await dbQuery('SELECT email, name, avatar, userId, bio, socialLink FROM users');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'ระบบขัดข้อง' });
  }
});

// Protected endpoint: returns full user data, restricted to admin/superadmin only
app.get('/api/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถดูข้อมูลผู้ใช้ทั้งหมดได้' });
  }
  try {
    const users = await dbQuery('SELECT email, name, userId, role, avatar, bio, socialLink, isSuspended FROM users');
    const formatted = users.map(u => ({ ...u, isSuspended: !!u.isSuspended }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'ระบบขัดข้อง' });
  }
});

app.put('/api/users/profile', authenticateToken, uploadAvatar.single('avatarFile'), async (req, res) => {
  const { email, name, bio, socialLink, avatarUrl } = req.body;
  if (req.user.email !== email && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'คุณไม่มีสิทธิ์อัปเดตข้อมูลของบุคคลอื่น' });
  }

  try {
    let finalAvatar = avatarUrl || '';
    if (req.file) {
      const currentUserInfo = await dbGet('SELECT avatar FROM users WHERE email = ?', [email]);
      if (currentUserInfo && currentUserInfo.avatar && currentUserInfo.avatar !== avatarUrl) {
        await deleteUploadedFile(currentUserInfo.avatar);
      }
      finalAvatar = await uploadToCloudOrLocal(req.file, req.file.filename);
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
  const isSelfDelete = req.user.email === email;

  // ผู้ดูแลระบบระดับสูง (Super Admin) ไม่สามารถลบบัญชีของตัวเองได้
  if (isSelfDelete && req.user.role === 'superadmin') {
    return res.status(400).json({ error: 'ผู้ดูแลระบบระดับสูง (Super Admin) ไม่สามารถลบบัญชีของตัวเองได้' });
  }

  // อนุญาตให้ผู้ใช้ลบบัญชีของตัวเอง หรือ superadmin ลบบัญชีของผู้อื่น
  if (!isSelfDelete && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบระดับสูง (Super Admin) เท่านั้นที่สามารถลบบัญชีผู้ใช้อื่นได้' });
  }

  try {
    const userInfo = await dbGet('SELECT avatar FROM users WHERE email = ?', [email]);
    const userProjects = await dbQuery('SELECT fileUrl FROM projects WHERE authorEmail = ?', [email]);

    if (userInfo && userInfo.avatar) {
      await deleteUploadedFile(userInfo.avatar);
    }
    for (const project of userProjects) {
      if (project.fileUrl) {
        await deleteUploadedFile(project.fileUrl);
      }
    }

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

app.post('/api/projects', authenticateToken, uploadProject.single('mediaFile'), async (req, res) => {
  const { title, description, type, tags, authorEmail, fileUrl: externalUrl } = req.body;
  if (req.user.email !== authorEmail) {
    return res.status(403).json({ error: 'ไม่สามารถเพิ่มผลงานในนามของผู้อื่นได้' });
  }

  try {
    let finalFileUrl = externalUrl || '';
    let fileName = '';
    let fileSize = '';

    if (req.file) {
      finalFileUrl = await uploadToCloudOrLocal(req.file, req.file.filename);
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

  try {
    // ดึงข้อมูลผลงานก่อนเพื่อตรวจสอบความเป็นเจ้าของ
    const project = await dbGet('SELECT authorEmail, fileUrl FROM projects WHERE id = ?', [id]);
    if (!project) {
      return res.status(404).json({ error: 'ไม่พบผลงานนี้ในระบบ' });
    }

    // อนุญาตให้เจ้าของผลงาน, admin, หรือ superadmin ลบผลงานได้
    if (req.user.email !== project.authorEmail && req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์ลบผลงานของผู้อื่น' });
    }

    if (project.fileUrl) {
      await deleteUploadedFile(project.fileUrl);
    }

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
      return res.status(400).json({ error: 'ขนาดไฟล์อัปโหลดเกินขีดจำกัดสูงสุดที่ระบบอนุญาต' });
    }
    return res.status(400).json({ error: 'ข้อผิดพลาดในการอัปโหลดไฟล์: ' + err.message });
  }
  if (err.message === 'ประเภทไฟล์ไม่ได้รับอนุญาตให้ใช้ในการอัปโหลด') {
    return res.status(400).json({ error: err.message });
  }
  
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในระบบเซิร์ฟเวอร์' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
