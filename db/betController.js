const db = require('./db');

const createMatchBet = (matchId, creatorId) => {
    const stmt = db.prepare('INSERT OR IGNORE INTO matches_bets (match_id, creator_id) VALUES (?, ?)');
    return stmt.run(matchId, creatorId);
};

const getMatchBetById = (matchId) => {
    const stmt = db.prepare('SELECT * FROM matches_bets WHERE match_id = ?');
    return stmt.get(matchId);
}

const closeMatchBet = (matchId) => {
    const stmt = db.prepare('UPDATE matches_bets SET is_open = 0, closed_at = CURRENT_TIMESTAMP WHERE match_id = ?');
    return stmt.run(matchId);
}

const addBet = (matchId, userId, amount, prediction) => {
    const stmt = db.prepare('INSERT INTO bets (match_id, user_id, amount, prediction) VALUES (?, ?, ?, ?)');
    return stmt.run(matchId, userId, amount, prediction);
}

const getBetsByMatchId = (matchId) => {
    const stmt = db.prepare('SELECT * FROM bets WHERE match_id = ?');
    return stmt.all(matchId);
}

module.exports = {
    createMatchBet,
    getMatchBetById,
    closeMatchBet,
    addBet,
    getBetsByMatchId
};