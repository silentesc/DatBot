import { Client } from "discord.js";
import { invokeApi } from "../api/api";
import { reactionRoles } from "../utils/cache";
import { setActivity } from "../utils/ActivityHandler";
import { Guild } from "../api/models";
import axios from "axios";


// Load reaction roles and fetch guild, channel, message and reactions users into cache
async function handleReactionRoleDataSync(client: Client) {
    const guildIds: Array<string> = client.guilds.cache.map((guild) => guild.id);
    for (const guildId of guildIds) {
        console.log("Fetching data for reaction roles from guild", guildId);
        const response = await axios.get(`${process.env.BACKEND_URL}/reaction_role/reaction_roles/${guildId}`, { params: { api_key: process.env.API_KEY } });
        for (const entry of response.data) {
            const channelId = entry["channel_id"]
            const messageId = entry["message_id"]
            const guild = await client.guilds.fetch(guildId);
            const channel = await guild.channels.fetch(channelId);
            if (channel && channel.isTextBased()) {
                const message = await channel.messages.fetch(messageId);
                await Promise.all(message.reactions.cache.map(r => r.users.fetch()));
                console.log("Fetched message and reaction with id", message.id);
            }
            else {
                console.error("Channel is undefined or not text based");
            }
            reactionRoles.push(entry);
        }
        console.log("Fetch complete for guild", guildId);
    }
}


async function handleGuildSync(client: Client) {
    const guildIds: Array<string> = client.guilds.cache.map((guild) => guild.id);

    const response = await axios.get(`${process.env.BACKEND_URL}/guild/guilds`, { params: { api_key: process.env.API_KEY } });
    const dbGuilds: Array<Guild> = response.data;

    const leftGuilds: Array<Guild> = dbGuilds.filter(dbGuild => !guildIds.includes(dbGuild.id) && dbGuild.bot_joined);
    const newGuildIds: Array<string> = guildIds.filter(guildId => {
        const dbGuild = dbGuilds.find(dbGuild => dbGuild.id === guildId);
        return !dbGuild || !dbGuild.bot_joined;
    });
    const newGuilds: Array<Guild> = await Promise.all(
        newGuildIds.map(async guildId => {
            let guild = client.guilds.cache.get(guildId);
            if (!guild) {
                guild = await client.guilds.fetch(guildId);
            }
            return { id: guild.id, name: guild.name, icon: guild.icon, bot_joined: true } as Guild;
        })
    );

    // Update left and new guilds for db in one Promise
    await Promise.all([
        ...leftGuilds.map(async leftGuild => {
            await axios.put(`${process.env.BACKEND_URL}/guild/guild`,
                {
                    id: leftGuild.id,
                    name: leftGuild.name,
                    icon: leftGuild.icon,
                    bot_joined: false,
                },
                { params: { api_key: process.env.API_KEY } }
            );
            console.log(`bot_joined for guild "${leftGuild.name}" (${leftGuild.id}) has been set to false in the db.`);
        }),
        ...newGuilds.map(async newGuild => {
            await axios.put(`${process.env.BACKEND_URL}/guild/guild`,
                {
                    id: newGuild.id,
                    name: newGuild.name,
                    icon: newGuild.icon,
                    bot_joined: true,
                },
                { params: { api_key: process.env.API_KEY } }
            );
            console.log(`bot_joined for guild "${newGuild.name}" (${newGuild.id}) has been set to true in the db.`);
        })
    ]);
}


export async function onReady(client: Client) {
    if (!client.user) {
        console.error("Client user is undefined after ready event.");
        return;
    }

    await client.guilds.fetch();

    await Promise.all([
        // handleReactionRoleDataSync(client),
        handleGuildSync(client),
    ]);

    setActivity(client);
    invokeApi(client);
    console.log(`Logged in as ${client.user.tag}`);
}
