import { Client, ActivityType, EmbedBuilder, GatewayIntentBits } from "discord.js";
import { readdirSync } from "fs";
import "dotenv/config";

import { invokeApi } from "./api/api";


const commands = new Map();
readdirSync("./src/commands").filter(file => file.endsWith(".ts")).forEach(fileName => {
    const commandName = fileName.split(".ts")[0];
    const command = require(`./commands/${commandName}`);
    commands.set(commandName, command);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
    ]
});


function setActivity() {
    if (!client.user) {
        console.error("Failed to set activity. Client user is undefined.");
        return;
    }
    client.user.setActivity({
        name: "/help",
        type: ActivityType.Watching
    });
}


client.once("ready", () => {
    if (!client.user) {
        console.error("Client user is undefined after ready event.");
        return;
    }
    setActivity();
    invokeApi(client);
    console.log(`Logged in as ${client.user.tag}`);
});


client.on("shardResume", (shardId) => {
    console.log(`Shard ${shardId} resumed.`);
    setActivity();
});


client.on("shardReconnecting", (shardId) => {
    console.log(`Shard ${shardId} is reconnecting...`);
});


client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand() || !interaction.guild) return;

    const command = commands.get(interaction.commandName);
    if (command) {
        try {
            await command.execute(client, interaction);
        }
        catch (error) {
            const timestamp = new Date().toISOString().replace('T', ' ').replace(/\..+/, '');
            console.log(`[${timestamp}] Catched error`);
            console.log("Executer:", interaction.user.tag);
            console.log("Command:", interaction.commandName);
            console.log("Options:", interaction.options.data);
            console.log(error);
            console.log("End of error");

            const responseEmbed = new EmbedBuilder()
                .setColor(0xfa4b4b)
                .setTitle("❗Error❗")
                .setDescription("An unexpected error occured while executing that command.\n**Please contact an admin or dev so it can be fixed!**");
            await interaction.reply({ embeds: [responseEmbed], ephemeral: true });
        }
    }
});


client.login(process.env.TOKEN);
