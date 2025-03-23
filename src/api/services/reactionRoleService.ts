import { Client, Message } from "discord.js";
import { Request, Response } from "express";
import { EmojiRole } from "../models";


export async function createReactionRole(request: Request, response: Response, client: Client) {
    const authHeader = request.headers.authorization;

    if (!authHeader || authHeader !== process.env.API_KEY) {
        return response.status(403).json({ error: "Forbidden" }).send();
    }

    const guildId = request.params.guildId as string;
    const channelId = request.params.channelId as string;
    const messageContent = request.query.message as string;
    let emoji_roles: Array<string> = request.query.emoji_roles as Array<string>;

    if (!guildId || !channelId || !messageContent || !emoji_roles) {
        return response.status(400).json({ error: "guildId or channelId or message or emoji_roles is undefined" }).send();
    }

    if (messageContent.length > 2000) {
        return response.status(400).json({ error: "Maximum message length of 2000 is exceeded" }).send();
    }

    const guild = (!client.guilds.cache.get(guildId)) ? await client.guilds.fetch(guildId) : client.guilds.cache.get(guildId);
    if (!guild) {
        return response.status(404).json({ error: "Guild not found" }).send();
    }

    const channel = (!guild.channels.cache.get(channelId)) ? await guild.channels.fetch(channelId) : guild.channels.cache.get(channelId);
    if (!channel || !channel.isTextBased()) {
        return response.status(404).json({ error: "Channel not found or not a text channel" }).send();
    }

    if (!Array.isArray(emoji_roles)) {
        emoji_roles = new Array<string>(emoji_roles);
    }

    const emojiRoles: Array<EmojiRole> = [];
    for (const er of emoji_roles) {
        const [emoji, role_id] = er.split(' ').map(part => part.split('=')[1].replace(/'/g, ''));
        if (emojiRoles.some(er => er.emoji === emoji)) {
            return response.status(400).json({ error: `Duplicate emoji: ${emoji}` }).send();
        }
        const role = (!guild.roles.cache.get(role_id)) ? await guild.roles.fetch(role_id) : guild.roles.cache.get(role_id);
        if (!role) {
            return response.status(400).json({ error: `Role not found: ${role_id}` }).send();
        }
        emojiRoles.push({ emoji, role_id });
    }

    if (emojiRoles.length > 20) {
        return response.status(400).json({ error: "Maximum of 20 emojis on a message is exceeded" }).send();
    }

    const sentMessage: Message = await channel.send(messageContent);

    for (const emojiRole of emojiRoles) {
        try {
            await sentMessage.react(emojiRole.emoji);
        } catch (error) {
            console.error(`Failed to react when creating a reaction role with error: ${error}`);
            return response.status(500).json({ error: `Failed to react with emoji: ${emojiRole.emoji}` }).send();
        }
    }

    // TODO Add to listener

    response.status(201).json({ message_id: sentMessage.id }).send();
}


export async function deleteReactionRole(request: Request, response: Response, client: Client) {
    const authHeader = request.headers.authorization;

    if (!authHeader || authHeader !== process.env.API_KEY) {
        return response.status(403).json({ error: "Forbidden" }).send();
    }

    const guildId = request.params.guildId as string;
    const channelId = request.params.channelId as string;
    const messageId = request.params.messageId as string;

    if (!guildId || !channelId || !messageId) {
        return response.status(400).json({ error: "guildId or channelId or messageId is undefined" }).send();
    }

    const guild = (!client.guilds.cache.get(guildId)) ? await client.guilds.fetch(guildId) : client.guilds.cache.get(guildId);
    if (!guild) {
        return response.status(404).json({ error: "Guild not found" }).send();
    }

    const channel = (!guild.channels.cache.get(channelId)) ? await guild.channels.fetch(channelId) : guild.channels.cache.get(channelId);
    if (!channel || !channel.isTextBased()) {
        return response.status(404).json({ error: "Channel not found or not a text channel" }).send();
    }

    try {
        const message = await channel.messages.fetch(messageId);
        await message.delete();
    } catch (error) {
        return response.status(404).json({ error: "Message not found" }).send();
    }

    // TODO Delete from listener

    response.status(204).send();
}
