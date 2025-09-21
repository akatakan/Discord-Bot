const { Events,EmbedBuilder } = require("discord.js");
const userService = require('../db/userController');
const betService = require('../db/betController');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction){
        if(!interaction.isModalSubmit()) return;
        const { customId } = interaction;
        if(!customId.startsWith('betModal-')){
            await interaction.reply({content: 'Geçersiz modal etkileşimi.', ephemeral: true});
            return;
        }
        const parts = customId.split('-');
        if(parts.length !== 3){
            await interaction.reply({content: 'Geçersiz modal etkileşimi.', ephemeral: true});
            return;
        }
        const matchId = parts[1];
        const minBetAmount = parseInt(parts[2], 10);
        if(isNaN(minBetAmount) || minBetAmount <= 0){
            await interaction.reply({content: 'Geçersiz minimum bahis miktarı.', ephemeral: true});
            return;
        }
        const betAmountStr = interaction.fields.getTextInputValue('betAmountInput');
        const betAmount = parseInt(betAmountStr, 10);
        if(isNaN(betAmount) || betAmount < minBetAmount){
            await interaction.reply({content: `Geçersiz bahis miktarı. Minimum bahis miktarı ${minBetAmount}.`, ephemeral: true});
            return;
        }
        const winOrLose = interaction.fields.getTextInputValue('winPredictionInput').toLowerCase();
        if(winOrLose !== 'win' && winOrLose !== 'lose'){
            await interaction.reply({content: 'Geçersiz tahmin. Lütfen "Win" veya "Lose" girin.', ephemeral: true});
            return;
        }
        let user = await userService.getUserById(interaction.user.id);
        if(!user){
            await interaction.reply({content: 'Kullanıcı bulunamadı. Lütfen önce bir komut kullanarak kaydolun.', ephemeral: true});
            return;
        }
        if(user.balance < betAmount){
            await interaction.reply({content: `Yetersiz bakiye. Mevcut bakiyeniz ${user.balance}.`, ephemeral: true});
            return;
        }
        await userService.updateUserBalance(interaction.user.id, -betAmount);
        await betService.addBet(matchId, interaction.user.id, betAmount, winOrLose);
        
        const bets = betService.getBetsByMatchId(matchId);
        console.log(`Current bets for match ${matchId}:`, bets);
        const winBets = bets.filter(b => b.prediction === 'win').map(b => `<@${b.user_id}>: ${b.amount}`);
        const loseBets = bets.filter(b => b.prediction === 'lose').map(b => `<@${b.user_id}>: ${b.amount}`);
        const prevFields = interaction.message.embeds[0].fields
        const summonerName = interaction.message.embeds[0].description;
        const embed = new EmbedBuilder()
            .setAuthor({ name: 'Japanese Garden LoL Bahis', iconURL: 'https://i.imgur.com/AfFp7pu.png'})
            .setTitle('Bahis Açılan Maçtaki Summoner')
            .setColor(0xFFD700)
            .setDescription(`${summonerName}`)
            .addFields(
                ...prevFields.filter(f => !['Win Bahisleri', 'Lose Bahisleri', 'Toplam Bahis Miktarı'].includes(f.name)),
                { name: 'Win Bahisleri', value: winBets.length > 0 ? winBets.join('\n') : 'Henüz bahis yok', inline: true },
                { name: 'Lose Bahisleri', value: loseBets.length > 0 ? loseBets.join('\n') : 'Henüz bahis yok', inline: true },
                { name: 'Toplam Bahis Miktarı', value: `${bets.reduce((sum, b) => sum + b.amount, 0)} JP`, inline: false },
            )
            .setTimestamp();
            
        await interaction.update({embeds: [embed]});
        
    }   
}