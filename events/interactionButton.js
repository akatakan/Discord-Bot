const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction){
        if(!interaction.isButton()) return;
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

        // Modal oluşturma
        const modal = new ModalBuilder()
        .setCustomId('betModal')
        .setTitle('Bet Amount');

        // Numara girişi inputu
        const amountInput = new TextInputBuilder()
        .setCustomId('betAmountInput')
        .setLabel("Bet miktarını gir")
        .setStyle(TextInputStyle.Short) // Kısa metin girişi
        .setPlaceholder('Sadece sayı girin')
        .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(amountInput);
        modal.addComponents(firstActionRow);

        // modalı kullanıcıya gönder
        await interaction.showModal(modal);

    }
}