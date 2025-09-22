const riotApi = require('../riot-api');

async function watchMatchEnd(matchId,summoner, onMatchEnd, interval = 30000) {
  return new Promise((resolve, reject) => {
    const timer = setInterval(async () => {
      try {
        const isEnded = await riotApi.isMatchEnd(matchId);
        console.log(`Polling match ${matchId}: ended = ${isEnded}`);
        if (isEnded) {
          clearInterval(timer);
          const embed = await onMatchEnd(matchId, summoner);
          resolve(embed);
        }
      } catch (error) {
        clearInterval(timer);
        reject(error);
      }
    }, interval);
  });
}

module.exports = { watchMatchEnd };
