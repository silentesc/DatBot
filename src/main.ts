import { Client, ActivityType, EmbedBuilder, GatewayIntentBits, MessageReaction, PartialMessageReaction, User, PartialUser, MessageReactionEventDetails, Partials } from "discord.js";
import { readdirSync } from "fs";
import "dotenv/config";

import { invokeApi } from "./api/api";
import { onMessageReactionAdd } from "./events/messageReactionAdd";
import { onMessageReactionRemove } from "./events/messageReactionRemove";
import { reactionRoles } from "./utils/cache";
import axios from "axios";


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
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
    ],
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


client.once("ready", async () => {
    if (!client.user) {
        console.error("Client user is undefined after ready event.");
        return;
    }

    // Load reaction roles and fetch guild, channel, message and reactions users into cache
    const guildIds: Array<string> = client.guilds.cache.map((guild) => guild.id);
    for (const guildId of guildIds) {
        const response = await axios.get(`${process.env.BACKEND_URL}/reaction_role/reaction_roles/${guildId}`, { params: { api_key: process.env.API_KEY } });
        for (const entry of response.data) {
            console.log("Fetching data for reaction roles from guild", guildId);
            const channelId = entry["channel_id"]
            const messageId = entry["message_id"]
            const guild = await client.guilds.fetch(guildId);
            const channel = await guild.channels.fetch(channelId);
            if (channel && channel.isTextBased()) {
                const message = await channel.messages.fetch(messageId);
                message.reactions.cache.map(r => r.users.fetch());
            }
            reactionRoles.push(entry);
            console.log("Fetch complete for guild", guildId);
        }
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


client.on("messageReactionAdd", async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser, _: MessageReactionEventDetails) => {
    await onMessageReactionAdd(client, reaction, user);
});


client.on("messageReactionRemove", async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser, _: MessageReactionEventDetails) => {
    await onMessageReactionRemove(client, reaction, user);
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
