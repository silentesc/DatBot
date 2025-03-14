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
