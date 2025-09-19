const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction){
        if(!interaction.isChatInputCommand()) return;
        const command = interaction.client.commands.get(interaction.commandName);

        if(!command){
            console.error("Komut bulunamadı.")
            return;
        }

        try{
            await command.execute(interaction);
        }
        catch(error){
            console.error(`Hata: ${error}`);
            if(interaction.replied || interaction.deferred){
                await interaction.followUp({content: 'Komutu çalıştırırken bir hata oluştu.', flags: MessageFlags.Ephemeral});
            }
            else{
                await interaction.reply({ content:'Komutu çalıştırırken bir hata oluştu', flags: MessageFlags.Ephemeral});
            }
        }
    }
}