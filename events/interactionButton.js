const { Events, MessageFlags } = require('discord.js');
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const userService = require('../db/userController');
const betService = require('../db/betController');
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
            const matchStarts = betService.getMatchBetById(matchId).started_at;
            // const now = Date.now();
            // const diff  = now - new Date(matchStarts).getTime();
            // if( diff > 5*60*1000){
            //     await interaction.reply({content: 'Bahis süresi doldu. Maç başladıktan 5 dk sonra bahis kabul edilemiyor.',flags: MessageFlags.Ephemeral});
            //     return;
            // }

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
            betService.closeMatchBet(matchId);
            betService.deleteMatchBets(matchId);
            await interaction.reply({content: 'Bahis iptal edildi.',flags: MessageFlags.Ephemeral});
            interaction.message.delete();
        }
        else{
            return;
        }

    }
}