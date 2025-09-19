const { SlashCommandBuilder, EmbedBuilder, MessageFlags,ButtonBuilder,ActionRowBuilder, ButtonStyle } = require('discord.js');
const riotApi = require('../../riot-api');
const { watchMatchEnd } = require('../../util/watchmatch');
const { closeMatchBet, getBetsByMatchId } = require('../../db/betController');
const { getUserById, updateUserBalance } = require('../../db/userController');
const championData = require('../../db/champion');

async function onMatchEnd(matchId) {
    console.log(`Match ${matchId} has ended. Processing bets...`);
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
        .addStringOption(option =>
            option.setName('tagline')
                .setDescription('The tagline of the player.')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('betamount')
                .setDescription('The amount of coins to bet.')
                .setMinValue(50)
                .setRequired(false)),

    async execute(interaction) {
        const summonerName = interaction.options.getString('summonername');
        const tagline = interaction.options.getString('tagline');
        const region = interaction.options.getString('region');
        const betAmount = interaction.options.getNumber('betamount') || 50;
        await interaction.reply("Fetching match data, please wait...");
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
                .setDescription(`${summonerName+"#"+tagline}`)
                .setColor(0xFFD700)
                .addFields(
                    { name: 'Blue Team', value: blueTeam, inline: true },
                    { name: 'Red Team', value: redTeam, inline: true },
                    { name: 'Blue Bans', value: blueBans || 'None', inline: false },
                    { name: 'Red Bans', value: redBans || 'None', inline: true },
                    { name: 'Min Bet Amount', value: `${betAmount} JP`, inline: false }

                )
                .setTimestamp();


            const join = new ButtonBuilder()
                .setCustomId(`placeBet_12312`)
                .setLabel("asdas")
                .setStyle(ButtonStyle.Success)
                .setDisabled(false);

            const quit = new ButtonBuilder()
                .setCustomId(`quitbet`)
                .setLabel("sadasd")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(false);

            const row = new ActionRowBuilder().addComponents(join,quit);

            await interaction.editReply({ embeds: [resultEmbed],components: [row] });

        } catch (error) {
            console.error('Error processing lolpoll command:', error);
            await interaction.editReply('An error occurred while fetching the match data. Please try again later.');
        }
    },
};
