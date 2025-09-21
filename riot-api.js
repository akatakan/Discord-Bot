const axios = require('axios');
require('dotenv').config();

const RIOT_API_KEY = process.env.RIOT_API_KEY;

class RiotAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.rateLimits = new Map();
    }

    async request({baseURL, url, method = 'GET', params}) {
        await this.waitIfRateLimited(url);

        try{
            const response = await axios({
                method,
                baseURL,
                url,
                params,
                headers: { 'X-Riot-Token': this.apiKey }
            });

            this.updateRateLimits(url, response.headers);
            return response.status === 204 ? null : response.data;
        }
        catch(error){
            if(error.response && error.response.status === 429){
                const retryAfter = parseInt(error.response.headers['retry-after'] || '1', 10);
                console.warn(`Rate limit aşıldı. ${retryAfter}s bekleniyor.`);
                await this.delay(retryAfter * 1000);
                return this.request({ baseURL, url, method, params });
            }
            return null;
        }
  
    }

    updateRateLimits(url, headers) {
        const limitHeader = headers['x-method-rate-limit'];
        const countHeader = headers['x-method-rate-limit-count'];
        if (limitHeader && countHeader) {
            const limits = limitHeader.split(',').map(s => s.split(':').map(Number));
            const counts = countHeader.split(',').map(s => s.split(':').map(Number));
            this.rateLimits.set(url, { limits, counts });
        }
    }

    async waitIfRateLimited(url) {
        if (!this.rateLimits.has(url)) return;
        const { limits, counts } = this.rateLimits.get(url);

        for (let i = 0; i < limits.length; i++) {
            const [limit, window] = limits[i];
            const [, count] = counts[i];
            if (count >= limit) {
                const waitTime = window * 1000;
                console.log(`Rate limit yaklaşılıyor (${count}/${limit}), ${waitTime} ms bekleniyor.`);
                await this.delay(waitTime);
            }
        }
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async getAccountBySummonerName(summonerName, tagline) {
        console.log(`Fetching account for ${summonerName}#${tagline}`);
        return this.request({
            baseURL: 'https://europe.api.riotgames.com',
            url: `/riot/account/v1/accounts/by-riot-id/${summonerName}/${tagline}`
        });
    }
    
    async getActiveGameBySummonerId(region,summonerId) {
        const regionToPrefix = {
            NA: 'na1',
            EUW: 'euw1',
            EUNE: 'eun1',
            KR: 'kr',
            TR: 'tr1',
            JP: 'jp1',
            BR: 'br1',
            LAN: 'la1',
            LAS: 'la2',
        };
        return this.request({
            baseURL: `https://${regionToPrefix[region]}.api.riotgames.com`,
            url: `/lol/spectator/v5/active-games/by-summoner/${summonerId}`
        });
    }

    async getMatchesByPuuid(puuid) {
       return this.request({
            baseURL: 'https://europe.api.riotgames.com',
            url: `/lol/match/v5/matches/by-puuid/${puuid}/ids`,
            params: { count: 1 }
        });
    }

    async getMatchById(matchId) {
        return this.request({
            baseURL: 'https://europe.api.riotgames.com',
            url: `/lol/match/v5/matches/${matchId}`
        });
    }

    async isMatchEnd(matchId) {
        const match = await this.getMatchById(matchId);
        if (!match) return false;
        return match.info.gameEndTimestamp != null;
    }

    async getMatchEndResult(matchId, summoner) {
        const match = await this.getMatchById(matchId);
        const participant = match.info.participants.find(p => p.puuid === summoner.puuid);
        return participant.win ? 'win' : 'lose';
    }
}

module.exports = new RiotAPI(RIOT_API_KEY);
