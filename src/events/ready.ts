import { Client } from "discord.js";
import { invokeApi } from "../api/api";
import { reactionRoles } from "../utils/cache";
import { setActivity } from "../utils/ActivityHandler";
import axios from "axios";


export async function onReady(client: Client) {
    if (!client.user) {
        console.error("Client user is undefined after ready event.");
        return;
    }

    // Load reaction roles and fetch guild, channel, message and reactions users into cache
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

    setActivity(client);
    invokeApi(client);
    console.log(`Logged in as ${client.user.tag}`);
}
