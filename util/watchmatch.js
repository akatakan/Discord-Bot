const riotApi = require('../riot-api');

async function watchMatchEnd(matchId, onMatchEnd, interval = 30000) {
  const timer = setInterval(async () => {
    try {
      const isEnded = await riotApi.isMatchEnd(matchId);
      console.log(`Polling match ${matchId}: ended = ${isEnded}`);
      if (isEnded) {
        clearInterval(timer);
        onMatchEnd(matchId);
      }
    } catch (error) {
      console.error('Match end polling error:', error);
    }
  }, interval);
}

module.exports = { watchMatchEnd };
