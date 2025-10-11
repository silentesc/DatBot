import { Client, EmbedBuilder, GatewayIntentBits, MessageReaction, PartialMessageReaction, User, PartialUser, MessageReactionEventDetails, Partials, GuildMember, PartialGuildMember } from "discord.js";
import { readdirSync } from "fs";
import "dotenv/config";

import { onMessageReactionAdd } from "./events/messageReactionAdd";
import { onMessageReactionRemove } from "./events/messageReactionRemove";
import { onReady } from "./events/clientReady";
import { setActivity } from "./utils/ActivityHandler";
import { onGuildCreate } from "./events/guildCreate";
import { onGuildDelete } from "./events/guildDelete";
import { onGuildMemberAdd } from "./events/guildMemberAdd";
import { onGuildMemberRemove } from "./events/guildMemberRemove";


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


client.once("clientReady", async () => {
    await onReady(client);
});


client.on("shardResume", (shardId) => {
    console.log(`Shard ${shardId} resumed.`);
    setActivity(client);
});


client.on("shardReconnecting", (shardId) => {
    console.log(`Shard ${shardId} is reconnecting...`);
});


client.on("messageReactionAdd", (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser, _: MessageReactionEventDetails) => {
    onMessageReactionAdd(client, reaction, user);
});


client.on("messageReactionRemove", (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser, _: MessageReactionEventDetails) => {
    onMessageReactionRemove(client, reaction, user);
});


client.on("guildCreate", guild => {
    onGuildCreate(guild);
});


client.on("guildDelete", guild => {
    onGuildDelete(guild);
});

client.on("guildMemberAdd", (member: GuildMember) => {
    onGuildMemberAdd(member);
});


client.on("guildMemberRemove", (member: GuildMember | PartialGuildMember) => {
    onGuildMemberRemove(member);
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
