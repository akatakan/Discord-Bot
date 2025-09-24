const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const userService = require('../../db/userController');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Günlük bonus JP al!'),
  
  async execute(interaction) {
    const userId = interaction.user.id;
    const username = interaction.user.username;
    
    let user = userService.getUserById(userId);
    if (!user) {
      userService.addUser(userId, username);
      user = userService.getUserById(userId);
    }
    
    if (!userService.canClaimDaily(userId)) {
      const embed = new EmbedBuilder()
        .setTitle('⏰ Günlük Bonus')
        .setDescription('Günlük bonusunuzu zaten aldınız! 24 saat sonra tekrar deneyin.')
        .setColor(0xFF6B6B)
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }
    
    const dailyAmount = 200;
    userService.claimDailyBalance(userId, dailyAmount);
    
    const newBalance = userService.getUserBalance(userId);
    
    const embed = new EmbedBuilder()
      .setTitle('🎁 Günlük Bonus Alındı!')
      .setDescription(`**${dailyAmount} JP** günlük bonusunuzu aldınız!`)
      .addFields(
        { name: '💰 Yeni Bakiyeniz', value: `${newBalance} JP`, inline: true }
      )
      .setColor(0x00FF00)
      .setFooter({ text: 'Bir sonraki bonus 24 saat sonra!' })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  }
};
