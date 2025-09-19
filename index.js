const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('node:path');
require('dotenv').config();
const token  = process.env.TOKEN;
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const foldersPath = path.join(__dirname,'commands');
const commandFolder = fs.readdirSync(foldersPath);

for(const folder of commandFolder){
    const commandPath = path.join(foldersPath,folder);
    const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith(".js"));
    for(const file of commandFiles){
        const filePath = path.join(commandPath,file);
        const command = require(filePath);

        if('data' in command && 'execute' in command){
            client.commands.set(command.data.name,command);
        }
        else{
            console.log('Komut bulunamadı. Dosya eksik veya data,execute tanımlayıcıları eksik.');
        }
    }
}



client.login(token);