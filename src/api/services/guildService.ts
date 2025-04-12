import { Channel, Client, Collection, GuildBasedChannel, NonThreadGuildBasedChannel, ThreadChannel } from "discord.js";
import { Request, Response } from "express";


export async function getGuilds(request: Request, response: Response, client: Client) {
    const authHeader = request.headers.authorization;

    if (!authHeader || authHeader !== process.env.API_KEY) {
        return response.status(403).json({ error: "Forbidden" }).send();
    }

    const guilds = client.guilds.cache.map(guild => ({
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
    }));

    response.status(200).json(guilds).send();
}


export async function getChannels(request: Request, response: Response, client: Client) {
    const authHeader = request.headers.authorization;

    if (!authHeader || authHeader !== process.env.API_KEY) {
        return response.status(403).json({ error: "Forbidden" }).send();
    }

    const guildId = request.params.guildId;
    const guild = (!client.guilds.cache.get(guildId)) ? await client.guilds.fetch(guildId).catch(_ => { }) : client.guilds.cache.get(guildId);

    if (!guild) {
        return response.status(404).json({ error: "Guild not found" }).send();
    }

    let channelsCollection: Collection<string, NonThreadGuildBasedChannel>;

    if (guild.channels.cache.size > 0) {
        channelsCollection = guild.channels.cache
            .filter(channel => channel !== null)
            .filter((channel): channel is NonThreadGuildBasedChannel =>
                !(channel instanceof ThreadChannel) &&
                (channel && (channel.isTextBased() || channel.isVoiceBased()))
            );
    } else {
        try {
            console.log("Fetching channels...");
            const fetchedChannels = await guild.channels.fetch();
            channelsCollection = fetchedChannels
                .filter(channel => channel !== null)
                .filter((channel): channel is NonThreadGuildBasedChannel =>
                    !(channel instanceof ThreadChannel) &&
                    (channel.isTextBased() || channel.isVoiceBased())
                );
        } catch (error) {
            console.error(error);
            return response.status(500).json({ error: "Failed to fetch channels" }).send();
        }
    }

    const channelData = channelsCollection.map(channel => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        parentId: channel.parentId,
        position: channel.position,
    }));

    response.status(200).json(channelData).send();
}


export async function getRoles(request: Request, response: Response, client: Client) {
    const authHeader = request.headers.authorization;

    if (!authHeader || authHeader !== process.env.API_KEY) {
        return response.status(403).json({ error: "Forbidden" }).send();
    }

    const guildId = request.params.guildId;
    const guild = (!client.guilds.cache.get(guildId)) ? await client.guilds.fetch(guildId).catch(_ => { }) : client.guilds.cache.get(guildId);

    if (!guild) {
        return response.status(404).json({ error: "Guild not found" }).send();
    }

    let roles;
    if (guild.roles.cache.size > 0) {
        roles = guild.roles.cache;
    }
    else {
        try {
            console.log("Fetching roles...");
            roles = await guild.roles.fetch();
        } catch (error) {
            console.error(error);
            return response.status(500).json({ error: "Failed to fetch roles" }).send();
        }
    }

    const roleData = roles
        .map(role => ({
            id: role.id,
            name: role.name,
            color: role.color,
            position: role.position,
            managed: role.managed,
        }));

    response.status(200).json(roleData).send();
}
