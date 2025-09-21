const riotApi = require('../riot-api');

async function watchMatchEnd(matchId,summoner,interaction, onMatchEnd, interval = 30000) {
  const timer = setInterval(async () => {
    try {
      const isEnded = await riotApi.isMatchEnd(matchId);
      console.log(`Polling match ${matchId}: ended = ${isEnded}`);
      if (isEnded) {
        clearInterval(timer);
        onMatchEnd(matchId,summoner,interaction);
      }
    } catch (error) {
      console.error('Match end polling error:', error);
    }
  }, interval);
}

module.exports = { watchMatchEnd };
