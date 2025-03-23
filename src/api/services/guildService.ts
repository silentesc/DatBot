import { Client } from "discord.js";
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
    const guild = (!client.guilds.cache.get(guildId)) ? await client.guilds.fetch(guildId) : client.guilds.cache.get(guildId);

    if (!guild) {
        return response.status(404).json({ error: "Guild not found" }).send();
    }

    const channels = await guild.channels.fetch();
    const channelData = channels
        .map(channel => channel ? ({
            id: channel.id,
            name: channel.name,
            type: channel.type,
            parentId: channel.parentId
        }) : null)
        .filter(channel => channel !== null);

    response.status(200).json(channelData).send();
}


export async function getRoles(request: Request, response: Response, client: Client) {
    const authHeader = request.headers.authorization;

    if (!authHeader || authHeader !== process.env.API_KEY) {
        return response.status(403).json({ error: "Forbidden" }).send();
    }

    const guildId = request.params.guildId;
    const guild = (!client.guilds.cache.get(guildId)) ? await client.guilds.fetch(guildId) : client.guilds.cache.get(guildId);

    if (!guild) {
        return response.status(404).json({ error: "Guild not found" }).send();
    }

    const roles = await guild.roles.fetch();
    const roleData = roles.map(role => ({
        id: role.id,
        name: role.name,
        color: role.color,
        position: role.position
    }));

    response.status(200).json(roleData).send();
}
