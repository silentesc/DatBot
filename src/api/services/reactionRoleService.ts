import { Client, Message } from "discord.js";
import { Request, Response } from "express";
import { EmojiRole } from "../models";


export async function createReactionRole(request: Request, response: Response, client: Client) {
    const authHeader = request.headers.authorization;

    if (!authHeader || authHeader !== process.env.API_KEY) {
        return response.status(403).send('Forbidden');
    }

    const guildId = request.params.guildId as string;
    const channelId = request.params.channelId as string;
    const messageContent = request.query.message as string;
    const emoji_roles = request.query.emoji_roles as Array<string>;

    if (!guildId || !channelId || !messageContent || !emoji_roles) {
        return response.status(400).send('guildId or channelId or message or emoji_roles is undefined.');
    }

    if (messageContent.length > 2000) {
        return response.status(400).send('Maximum message length of 2000 is exceeded');
    }

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
        return response.status(404).send('Guild not found');
    }

    const channel = guild.channels.cache.get(channelId);
    if (!channel || !channel.isTextBased()) {
        return response.status(404).send('Channel not found or not a text channel');
    }

    const emojiRoles: Array<EmojiRole> = [];
    for (const er of emoji_roles) {
        const [emoji, role_id] = er.split(' ').map(part => part.split('=')[1].replace(/'/g, ''));
        if (emojiRoles.some(er => er.emoji === emoji)) {
            return response.status(400).send(`Duplicate emoji: ${emoji}`);
        }
        const role = guild.roles.cache.get(role_id);
        if (!role) {
            return response.status(404).send(`Role not found: ${role_id}`);
        }
        emojiRoles.push({ emoji, role_id });
    }

    if (emojiRoles.length > 20) {
        return response.status(400).send("Maximum of 20 emojis on a message is exceeded");
    }

    const sentMessage: Message = await channel.send(messageContent);

    for (const emojiRole of emojiRoles) {
        await sentMessage.react(emojiRole.emoji);
    }

    response.status(200).json({ message: 'Reaction roles created successfully' });
}
