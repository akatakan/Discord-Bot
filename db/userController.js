const db = require('./db');

const getUserById = (userId) => {
    const stmt = db.prepare('SELECT * FROM users WHERE user_id = ?');
    return stmt.get(userId);
};

const addUser = (userId, username) => {
    const stmt = db.prepare('INSERT INTO users (user_id, username) VALUES (?, ?)');
    return stmt.run(userId, username);
}

const addUserBalance = (userId, amount) => {
    const stmt = db.prepare('UPDATE users SET balance = balance + ? WHERE user_id = ?');
    return stmt.run(amount, userId);
}
const getUserBalance = (userId) => {
    const stmt = db.prepare('SELECT balance FROM users WHERE user_id = ?');
    const row = stmt.get(userId);
    return row ? row.balance : null;
}

const getTopUsers = (limit = 10) => {
    const stmt = db.prepare('SELECT user_id, username, balance FROM users ORDER BY balance DESC LIMIT ?');
    return stmt.all(limit);
}

const canClaimDaily = (userId) => {
  const stmt = db.prepare(`SELECT last_daily_claim FROM users WHERE user_id = ?`);
  const user = stmt.get(userId);
  
  if (!user || !user.last_daily_claim) return true;
  
  const lastClaim = new Date(user.last_daily_claim);
  const now = new Date();
  const hoursSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60);
  
  return hoursSinceLastClaim >= 24;
};

const claimDailyBalance = (userId, amount = 200) => {
  const stmt = db.prepare(`
    UPDATE users 
    SET balance = balance + ?, last_daily_claim = CURRENT_TIMESTAMP 
    WHERE user_id = ?
  `);
  return stmt.run(amount, userId);
};

module.exports = {
    getUserById,
    addUser,
    addUserBalance,
    getUserBalance,
    getTopUsers,
    canClaimDaily,
    claimDailyBalance
};