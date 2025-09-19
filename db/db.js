const Database = require('better-sqlite3');
const db = new Database('japbet.db');
db.pragma("FOREIGN_KEYS = ON");

db.prepare(`
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    username TEXT,
    balance INTEGER DEFAULT 1000
);
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS matches_bets (
    match_id TEXT PRIMARY KEY,
    creator_id TEXT,
    is_open INTEGER DEFAULT 1,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,
    FOREIGN KEY(creator_id) REFERENCES users(user_id)
);
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS bets (
    bet_id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id TEXT,
    user_id TEXT,
    amount INTEGER,
    prediction INTEGER,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(match_id) REFERENCES matches_bets(match_id),
    FOREIGN KEY(user_id) REFERENCES users(user_id),
    UNIQUE(match_id, user_id)
);
`).run();

module.exports = db;