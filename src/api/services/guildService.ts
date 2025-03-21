import { Client } from "discord.js";
import { Request, Response } from "express";


export async function getGuilds(request: Request, response: Response, client: Client) {
    const authHeader = request.headers.authorization;

    if (!authHeader || authHeader !== process.env.API_KEY) {
        return response.status(403).send('Forbidden');
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
        return response.status(403).send('Forbidden');
    }

    const guildId = request.params.guildId;
    const guild = client.guilds.cache.get(guildId);

    if (!guild) {
        return response.status(404).json({ error: "Guild not found" }).send();
    }

    const channels = guild.channels.cache.map(channel => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        parentId: channel.parentId
    }));

    response.status(200).json(channels).send();
}


export async function getRoles(request: Request, response: Response, client: Client) {
    const authHeader = request.headers.authorization;

    if (!authHeader || authHeader !== process.env.API_KEY) {
        return response.status(403).send('Forbidden');
    }

    const guildId = request.params.guildId;
    const guild = client.guilds.cache.get(guildId);

    if (!guild) {
        return response.status(404).json({ error: "Guild not found" }).send();
    }

    const roles = guild.roles.cache.map(role => ({
        id: role.id,
        name: role.name,
        color: role.color,
        position: role.position
    }));

    response.status(200).json(roles).send();
}
