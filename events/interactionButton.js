const { Events, MessageFlags } = require('discord.js');
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const userService = require('../db/userController');
const betService = require('../db/betController');
const riotApi = require('../riot-api');
module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction){
        if(!interaction.isButton()) return;
        
        const { customId } = interaction;

        if(customId.startsWith('placeBet-')){
            const parts = customId.split('-');
            if(parts.length !== 3){
                await interaction.reply({content: 'Geçersiz buton etkileşimi.',flags: MessageFlags.Ephemeral});
                return;
            }
            const matchId = parts[1];
            const minBetAmount = parseInt(parts[2], 10);
            if(isNaN(minBetAmount) || minBetAmount <= 0){
                await interaction.reply({content: 'Geçersiz minimum bahis miktarı.',flags: MessageFlags.Ephemeral});
                return;
            }
            let user = await userService.getUserById(interaction.user.id);
            if(!user){
                await userService.addUser(interaction.user.id,interaction.user.username);
                user = await userService.getUserById(interaction.user.id);
            }
            if(user.balance < minBetAmount){
                await interaction.reply({content: `Yetersiz bakiye. Minimum bahis miktarı ${minBetAmount}.`,flags: MessageFlags.Ephemeral});
                return;
            }
            if(betService.hasActiveBet(interaction.user.id, matchId)){
                await interaction.reply({content: 'Bu maç için zaten aktif bir bahsiniz var.',flags: MessageFlags.Ephemeral});
                return;
            }
            const match = betService.getMatchBetById(matchId);
            const matchStarts = await riotApi.getActiveGameBySummonerId(match.region,match.summoner_id);
            if( matchStarts.gameLength > 300){
                await interaction.reply({content: 'Bahis süresi doldu. Maç başladıktan 5 dk sonra bahis kabul edilemiyor.',flags: MessageFlags.Ephemeral});
                return;
            }
            console.log(`${matchStarts.gameLength/60}:${matchStarts.gameLength%60} since match started.`);
            const modal = new ModalBuilder()
                .setCustomId(`betModal-${matchId}-${minBetAmount}`)
                .setTitle('Bahis Miktarını Girin');

            const betAmountInput = new TextInputBuilder()
                .setCustomId('betAmountInput')
                .setLabel(`Bahis Miktarı (Minimum ${minBetAmount})`)
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Bahis miktarınızı girin')
                .setRequired(true);

            const winPredictionInput = new TextInputBuilder()
                .setCustomId('winPredictionInput')
                .setLabel(`Win ya da Lose`)
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Win//Lose')
                .setRequired(true);

            const firstActionRow = new ActionRowBuilder().addComponents(betAmountInput);
            const secondActionRow = new ActionRowBuilder().addComponents(winPredictionInput);
            modal.addComponents(firstActionRow);
            modal.addComponents(secondActionRow);
            await interaction.showModal(modal);
        }
        else if(customId.startsWith('quitBet-')){
            const parts = customId.split('-');
            if(parts.length !== 3){
                await interaction.reply({content: 'Geçersiz buton etkileşimi.',flags: MessageFlags.Ephemeral});
                return;
            }
            const matchId = parts[1];
            const userId = parts[2];
            if(interaction.user.id !== userId){
                await interaction.reply({content: 'Bu butona tıklama yetkiniz yok.',flags: MessageFlags.Ephemeral});
                return;
            }
            const bets = betService.getBetsByMatchId(matchId);
            if(bets.length > 0){
                bets.forEach(async (bet) => {
                    await userService.addUserBalance(bet.user_id, bet.amount);
                });
            }
            betService.closeMatchBet(matchId);
            betService.deleteMatchBets(matchId);
            betService.deleteBets(matchId);
            await interaction.reply({content: 'Bahis iptal edildi.',flags: MessageFlags.Ephemeral});
            interaction.message.delete();
        }
        else{
            return;
        }

    }
}