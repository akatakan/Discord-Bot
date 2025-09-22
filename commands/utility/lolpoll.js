const { SlashCommandBuilder, EmbedBuilder,ButtonBuilder,ActionRowBuilder, ButtonStyle } = require('discord.js');
const riotApi = require('../../riot-api');
const { watchMatchEnd } = require('../../util/watchmatch');
const betController = require('../../db/betController');
const championData = require('../../db/champions.json');
const userService = require('../../db/userController');

async function onMatchEnd(matchId,summoner) {
    console.log(`Match ${matchId} has ended. Processing bets...`);
    riotApi.delay(30000);
    const matchBets = betController.getBetsByMatchId(matchId);
    if (!matchBets) {
        console.log(`No bets found for match ${matchId}.`);
        return;
    }

    const matchResult = await riotApi.getMatchEndResult(matchId,summoner);
    const winners = matchBets.filter(b => b.prediction === matchResult);
    console.log(`Match Result: ${matchResult}`);
    console.log(`Winners: ${JSON.stringify(winners)}`);
    winners.forEach(winner => {
        userService.addUserBalance(winner.user_id, winner.amount * 2);
        console.log(`User ${winner.user_id} won ${winner.amount * 2} JP.`);
    });
    betController.deleteMatchBets(matchId);
    console.log(`Bets for match ${matchId} have been processed and closed.`);
    const embed = new EmbedBuilder()
        .setTitle('Match Ended')
        .setDescription(`The match has ended. The winning team is **${matchResult}**.`)
        .setColor(0x00FF00)
        .addFields(
            { name: 'Winners', value: winners.length > 0 ? winners.map(w => `<@${w.user_id}>`).join(', ') : 'No winners this time.' }
        )
        .setFooter({ text: 'Thank you for betting with Japanese Garden LoL Bahis!' })
        .setTimestamp();
    return embed;
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName('lolpoll')
        .setDescription('Check the result of a League of Legends match.')
        .addStringOption(option =>
            option.setName('region')
                .setDescription('The region of the player (e.g., NA, EUW, EUNE, KR).')
                .setRequired(true)
                .addChoices(
                    { name: 'NA', value: 'NA' },
                    { name: 'EUW', value: 'EUW' },
                    { name: 'EUNE', value: 'EUNE' },
                    { name: 'KR', value: 'KR' },
                    { name: 'TR', value: 'TR' },
                    { name: 'JP', value: 'JP' },
                    { name: 'BR', value: 'BR' },
                    { name: 'LAN', value: 'LAN' },
                    { name: 'LAS', value: 'LAS' },
                ))
        .addStringOption(option =>
            option.setName('summonername')
                .setDescription('The summoner name of the player.')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('betamount')
                .setDescription('The amount of coins to bet.')
                .setMinValue(50)
                .setRequired(false)),

    async execute(interaction) {
        const summonerName = interaction.options.getString('summonername').split('#')[0];
        const tagline = interaction.options.getString('summonername').split('#')[1];
        const region = interaction.options.getString('region');
        const minBetAmount = interaction.options.getNumber('betamount') || 50;
        await interaction.deferReply();
        await interaction.editReply('Fetching match data, please wait...');
        try {
            const summoner = await riotApi.getAccountBySummonerName(summonerName, tagline);
            if (!summoner) {
                await interaction.editReply('Summoner not found. Please check the summoner name and tagline.');
                return;
            }
            const activeGame = await riotApi.getActiveGameBySummonerId(region,summoner.puuid);
            if (!activeGame) {
                await interaction.editReply('The summoner is not currently in an active game.');
                return;
            }

            const blueTeam = activeGame.participants.filter(p=> p.teamId === 100).map(p => {
                const champName = championData[p.championId] || "Unknown Champion";
                return `${p.riotId} - ${champName}`;
            }).join('\n');

            const redTeam = activeGame.participants.filter(p=> p.teamId === 200).map(p => {
                const champName = championData[p.championId] || "Unknown Champion";
                return `${p.riotId} - ${champName}`;
            }).join('\n');

            const redBans = activeGame.bannedChampions.filter(b => b.teamId === 200 && b.championId !== -1).map(b => championData[b.championId] || "Unknown Champion").join(', ');
            const blueBans = activeGame.bannedChampions.filter(b => b.teamId === 100 && b.championId !== -1).map(b => championData[b.championId] || "Unknown Champion").join(', ');
            
            const resultEmbed = new EmbedBuilder()
                .setAuthor({ name: 'Japanese Garden LoL Bahis', iconURL: 'https://i.imgur.com/AfFp7pu.png'})
                .setTitle('Summoner Name')
                .setDescription(`${summonerName+"#"+tagline} ${blueTeam.includes(summonerName+"#"+tagline) ? '(Blue Team)' : ('Red Team')}`)
                .setColor(0xFFD700)
                .addFields(
                    { name: 'Blue Team', value: blueTeam, inline: true },
                    { name: 'Red Team', value: redTeam, inline: true },
                    { name: 'Blue Bans', value: blueBans || 'None', inline: false },
                    { name: 'Red Bans', value: redBans || 'None', inline: true },
                    { name: 'Min Bet Amount', value: `${minBetAmount} JP`, inline: false }

                )
                .setTimestamp();
            
            const user = userService.getUserById(interaction.user.id);
            if(!user){
                userService.addUser(interaction.user.id, interaction.user.username);
                console.log(`New user added: ${interaction.user.username} (${interaction.user.id})`);
            }
            const matchId = activeGame.platformId+"_"+activeGame.gameId;
            const start_time = new Date(activeGame.gameStartTime);
            betController.createMatchBet(matchId, interaction.user.id,start_time.toDateString());
       
            const join = new ButtonBuilder()
                .setCustomId(`placeBet-${matchId}-${minBetAmount}`)
                .setLabel("Bahis Yap")
                .setStyle(ButtonStyle.Success)
                .setDisabled(false);

            const quit = new ButtonBuilder()
                .setCustomId(`quitBet-${matchId}-${interaction.user.id}`)
                .setLabel("İptal Et")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(false);

            const row = new ActionRowBuilder().addComponents(join,quit);

            await interaction.editReply({ embeds: [resultEmbed],components: [row]});
            try {
                console.log(`Watching match ${matchId} for end...`);
                const embed = await watchMatchEnd(matchId, summoner, onMatchEnd);
                await interaction.followUp({ embeds: [embed] });
            } catch(error) {
                console.error('Error watching match end:', error);
                await interaction.editReply('An error occurred while processing the match result.');
            }
        } catch (error) {
            console.error('Error processing lolpoll command:', error);
            await interaction.editReply('An error occurred while fetching the match data. Please try again later.');
        }
    },
};
