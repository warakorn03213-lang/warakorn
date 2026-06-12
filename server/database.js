const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.run('PRAGMA foreign_keys = ON');

db.serialize(() => {
  db.run(`
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
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY,
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
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS likes (
      userEmail TEXT NOT NULL,
      projectId INTEGER NOT NULL,
      PRIMARY KEY (userEmail, projectId),
      FOREIGN KEY (userEmail) REFERENCES users(email) ON DELETE CASCADE,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS follows (
      followerEmail TEXT NOT NULL,
      followedEmail TEXT NOT NULL,
      PRIMARY KEY (followerEmail, followedEmail),
      FOREIGN KEY (followerEmail) REFERENCES users(email) ON DELETE CASCADE,
      FOREIGN KEY (followedEmail) REFERENCES users(email) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY,
      projectId INTEGER NOT NULL,
      authorEmail TEXT NOT NULL,
      authorName TEXT NOT NULL,
      text TEXT NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (authorEmail) REFERENCES users(email) ON DELETE CASCADE
    )
  `);

  db.get("SELECT COUNT(*) as count FROM users WHERE email = 'admin@admin.com'", (err, row) => {
    if (!err && row.count === 0) {
      const adminPasswordHash = bcrypt.hashSync('admin123', 10);
      db.run(`
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
  });

  db.get("SELECT COUNT(*) as count FROM users WHERE email = 'admin2@admin.com'", (err, row) => {
    if (!err && row.count === 0) {
      const admin2PasswordHash = bcrypt.hashSync('admin123', 10);
      db.run(`
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
  });
});

module.exports = db;
