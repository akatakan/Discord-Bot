const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const userService = require('../../db/userController');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lb')
        .setDescription('Show the top 10 users with the highest balance.'),
    async execute(interaction) {
        const topUsers = userService.getTopUsers(10);

        const embed = new EmbedBuilder()
            .setTitle('Leaderboard')
            .setDescription('Top 10 Users by Balance')
            .addFields(
                { name: 'Rank', value: topUsers.map((user, index) => `${index + 1}`).join('\n'), inline: true },
                { name: 'User', value: topUsers.map(user => `<@${user.user_id}>`).join('\n'), inline: true },
                { name: 'Balance', value: topUsers.map(user => user.user_id === "194784929991753728" ? `${user.balance} Çekirge` : `${user.balance} JP`).join('\n'), inline: true }
            )
            .setColor(0xFFD700)
            .setFooter({ text: 'Top 10 Users by Balance' });

        if (topUsers.length === 0) {
            await interaction.reply('No users found in the leaderboard.');
            return;
        }
        
        await interaction.reply({ embeds: [embed] });
    }
};