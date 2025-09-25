const riotApi = require('../riot-api');
let timer;

async function watchMatchEnd(matchId,summoner, onMatchEnd, interval = 30000) {
  return new Promise((resolve, reject) => {
    timer = setInterval(async () => {
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

async function stopWatchingMatch() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log('Stopped watching match.');
  }
}

module.exports = { watchMatchEnd ,stopWatchingMatch };
