import { Client, Message } from "discord.js";
import { Request, Response } from "express";
import { EmojiRole } from "../models";
import { reactionRoles, ReactionRoleType, setReactionRoles } from "../../utils/cache";


export async function createReactionRole(request: Request, response: Response, client: Client) {
    const authHeader = request.headers.authorization;

    if (!authHeader || authHeader !== process.env.API_KEY) {
        return response.status(403).json({ error: "Forbidden" })
    }

    const guildId = request.params.guildId as string;
    const channelId = request.params.channelId as string;
    const type = request.query.type as string;
    const messageContent = request.query.message as string;
    let emoji_roles = request.query.emoji_roles as string;

    if (!guildId || !channelId || !type || !messageContent || !emoji_roles) {
        return response.status(400).json({ error: "guildId or channelId or type or message or emoji_roles is undefined" })
    }

    let emojiRoles: Array<EmojiRole> = [];

    try {
        emojiRoles = JSON.parse(emoji_roles);
    } catch (error) {
        return response.status(400).json({ error: "Invalid JSON format for emoji_roles" })
    }

    if (!Object.values(ReactionRoleType).includes(type as ReactionRoleType)) {
        return response.status(400).json({ error: `type not valid. Valid types: ${Object.values(ReactionRoleType).join(", ")}` })
    }

    if (messageContent.length > 2000) {
        return response.status(400).json({ error: "Maximum message length of 2000 is exceeded" })
    }

    const guild = (!client.guilds.cache.get(guildId)) ? await client.guilds.fetch(guildId).catch(_ => { }) : client.guilds.cache.get(guildId);
    if (!guild) {
        return response.status(404).json({ error: "Guild not found" })
    }

    const channel = (!guild.channels.cache.get(channelId)) ? await guild.channels.fetch(channelId).catch(_ => { }) : guild.channels.cache.get(channelId);
    if (!channel || !channel.isTextBased()) {
        return response.status(404).json({ error: "Channel not found or not a text channel" })
    }

    if (emojiRoles.length < 1) {
        return response.status(400).json({ error: "At least one emoji is required" })
    }

    if (emojiRoles.length > 20) {
        return response.status(400).json({ error: "Maximum of 20 emojis on a message is exceeded" })
    }

    let sentMessage: Message;
    try {
        sentMessage = await channel.send(messageContent);
    } catch (error) {
        console.error(`Failed to send message with error: ${error}`);
        return response.status(500).json({ error: `Failed to send message` })
    }

    for (const emojiRole of emojiRoles) {
        try {
            await sentMessage.react(emojiRole.emoji);
        } catch (error) {
            console.error(`Failed to react when creating a reaction role with error: ${error}`);
            return response.status(500).json({ error: `Failed to react with emoji: ${emojiRole.emoji}` })
        }
    }

    reactionRoles.push({
        "type": type,
        "message_id": sentMessage.id,
        "emoji_roles": emojiRoles,
    });

    return response.status(201).json({ message_id: sentMessage.id })
}


export async function deleteReactionRole(request: Request, response: Response, client: Client) {
    const authHeader = request.headers.authorization;

    if (!authHeader || authHeader !== process.env.API_KEY) {
        return response.status(403).json({ error: "Forbidden" })
    }

    const guildId = request.params.guildId as string;
    const channelId = request.params.channelId as string;
    const messageId = request.params.messageId as string;

    if (!guildId || !channelId || !messageId) {
        return response.status(400).json({ error: "guildId or channelId or messageId is undefined" })
    }

    const guild = (!client.guilds.cache.get(guildId)) ? await client.guilds.fetch(guildId).catch(_ => { }) : client.guilds.cache.get(guildId);
    if (!guild) {
        return response.status(404).json({ error: "Guild not found" })
    }

    const channel = (!guild.channels.cache.get(channelId)) ? await guild.channels.fetch(channelId).catch(_ => { }) : guild.channels.cache.get(channelId);
    if (!channel || !channel.isTextBased()) {
        return response.status(404).json({ error: "Channel not found or not a text channel" })
    }

    try {
        const message = await channel.messages.fetch(messageId).catch(_ => { });
        if (message) {
            await message.delete();
        }
    } catch (error) {
        return response.status(404).json({ error: "Message not found" })
    }

    const updatedReactionRoles = reactionRoles.filter(
        role => role["message_id"] !== messageId
    );
    setReactionRoles(updatedReactionRoles);

    return response.status(204).send();
}
