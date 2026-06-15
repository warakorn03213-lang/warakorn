const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const isPg = !!process.env.DATABASE_URL;
let pool = null;
let sqliteDb = null;

if (isPg) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const dbPath = path.join(__dirname, 'database.sqlite');
  sqliteDb = new sqlite3.Database(dbPath);
  sqliteDb.run('PRAGMA foreign_keys = ON');
}

// Convert SQLite query placeholders (?) to PostgreSQL ($1, $2...)
function convertSql(sql) {
  if (!isPg) return sql;
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

const pgKeyMap = {
  userid: 'userId',
  sociallink: 'socialLink',
  issuspended: 'isSuspended',
  fileurl: 'fileUrl',
  filename: 'fileName',
  filesize: 'fileSize',
  authoremail: 'authorEmail',
  useremail: 'userEmail',
  projectid: 'projectId',
  followeremail: 'followerEmail',
  followedemail: 'followedEmail',
  authorname: 'authorName',
  authoravatar: 'authorAvatar'
};

function mapRowKeys(row) {
  if (!row) return row;
  const mapped = {};
  for (const key of Object.keys(row)) {
    const mappedKey = pgKeyMap[key] || key;
    mapped[mappedKey] = row[key];
  }
  return mapped;
}

const dbQuery = (sql, params = []) => {
  const convertedSql = convertSql(sql);
  return new Promise((resolve, reject) => {
    if (isPg) {
      pool.query(convertedSql, params, (err, res) => {
        if (err) reject(err);
        else resolve(res.rows.map(mapRowKeys));
      });
    } else {
      sqliteDb.all(convertedSql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    }
  });
};

const dbGet = (sql, params = []) => {
  const convertedSql = convertSql(sql);
  return new Promise((resolve, reject) => {
    if (isPg) {
      pool.query(convertedSql, params, (err, res) => {
        if (err) reject(err);
        else resolve(res.rows[0] ? mapRowKeys(res.rows[0]) : null);
      });
    } else {
      sqliteDb.get(convertedSql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    }
  });
};

const dbRun = (sql, params = []) => {
  const convertedSql = convertSql(sql);
  return new Promise((resolve, reject) => {
    if (isPg) {
      pool.query(convertedSql, params, (err, res) => {
        if (err) reject(err);
        else resolve({ id: null, changes: res.rowCount });
      });
    } else {
      sqliteDb.run(convertedSql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    }
  });
};

// Initialize Tables
const initDatabase = async () => {
  // SQLite maps BIGINT to INTEGER affinity, so BIGINT works for both!
  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      userId TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'creator',
      avatar TEXT,
      bio TEXT,
      socialLink TEXT,
      isSuspended INTEGER DEFAULT 0
    )
  `;

  const projectsTable = `
    CREATE TABLE IF NOT EXISTS projects (
      id BIGINT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      fileUrl TEXT NOT NULL,
      fileName TEXT,
      fileSize TEXT,
      date TEXT NOT NULL,
      tags TEXT,
      authorEmail TEXT NOT NULL,
      isSuspended INTEGER DEFAULT 0,
      FOREIGN KEY (authorEmail) REFERENCES users(email) ON DELETE CASCADE
    )
  `;

  const likesTable = `
    CREATE TABLE IF NOT EXISTS likes (
      userEmail TEXT NOT NULL,
      projectId BIGINT NOT NULL,
      PRIMARY KEY (userEmail, projectId),
      FOREIGN KEY (userEmail) REFERENCES users(email) ON DELETE CASCADE,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `;

  const followsTable = `
    CREATE TABLE IF NOT EXISTS follows (
      followerEmail TEXT NOT NULL,
      followedEmail TEXT NOT NULL,
      PRIMARY KEY (followerEmail, followedEmail),
      FOREIGN KEY (followerEmail) REFERENCES users(email) ON DELETE CASCADE,
      FOREIGN KEY (followedEmail) REFERENCES users(email) ON DELETE CASCADE
    )
  `;

  const commentsTable = `
    CREATE TABLE IF NOT EXISTS comments (
      id BIGINT PRIMARY KEY,
      projectId BIGINT NOT NULL,
      authorEmail TEXT NOT NULL,
      authorName TEXT NOT NULL,
      text TEXT NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (authorEmail) REFERENCES users(email) ON DELETE CASCADE
    )
  `;

  try {
    await dbRun(usersTable);
    await dbRun(projectsTable);
    await dbRun(likesTable);
    await dbRun(followsTable);
    await dbRun(commentsTable);

    // Create default Admin accounts if they don't exist
    const adminExist = await dbGet("SELECT COUNT(*) as count FROM users WHERE email = 'admin@admin.com'");
    const adminCount = adminExist ? parseInt(adminExist.count, 10) : 0;
    if (adminCount === 0) {
      const adminPasswordHash = bcrypt.hashSync('admin123', 10);
      await dbRun(`
        INSERT INTO users (email, password, name, userId, role, avatar)
        VALUES (
          'admin@admin.com',
          ?,
          'แอดมินระดับสูง (Super Admin)',
          'ADM01',
          'superadmin',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80'
        )
      `, [adminPasswordHash]);
    }

    const admin2Exist = await dbGet("SELECT COUNT(*) as count FROM users WHERE email = 'admin2@admin.com'");
    const admin2Count = admin2Exist ? parseInt(admin2Exist.count, 10) : 0;
    if (admin2Count === 0) {
      const admin2PasswordHash = bcrypt.hashSync('admin123', 10);
      await dbRun(`
        INSERT INTO users (email, password, name, userId, role, avatar)
        VALUES (
          'admin2@admin.com',
          ?,
          'แอดมินทั่วไป (Admin)',
          'ADM02',
          'admin',
          ''
        )
      `, [admin2PasswordHash]);
    }
  } catch (err) {
    console.error('Error initializing database tables:', err);
  }
};

initDatabase();

module.exports = {
  dbQuery,
  dbGet,
  dbRun,
  isPg
};
