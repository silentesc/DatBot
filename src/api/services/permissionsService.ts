import { Client, PermissionsBitField } from "discord.js";
import { Request, Response } from "express";


export async function canSendMessagesInChannel(request: Request, response: Response, client: Client) {
    const authHeader = request.headers.authorization;

    if (!authHeader || authHeader !== process.env.API_KEY) {
        return response.status(403).json({ error: "Forbidden" })
    }

    const guildId = request.params.guildId as string;
    const channelId = request.params.channelId as string;

    if (!guildId || !channelId) {
        return response.status(400).json({ error: "guildId or channelId is undefined" });
    }

    const guild = (!client.guilds.cache.get(guildId)) ? await client.guilds.fetch(guildId).catch(_ => { }) : client.guilds.cache.get(guildId);
    if (!guild) {
        return response.status(404).json({ error: "Guild not found" })
    }

    const channel = (!guild.channels.cache.get(channelId)) ? await guild.channels.fetch(channelId).catch(_ => { }) : guild.channels.cache.get(channelId);
    if (!channel || !channel.isTextBased()) {
        return response.status(404).json({ error: "Channel not found or not a text channel" })
    }

    if (!client.user) {
        return response.status(500).json({ error: "client is null (this should not happen)" })
    }
    const me = guild.members.me || await guild.members.fetch(client.user.id).catch(_ => { });
    if (!me) {
        return response.status(404).json({ error: "Client not found" })
    }
    const permissions = channel.permissionsFor(me);
    const hasPermission = permissions?.has([
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ViewChannel,
    ])

    return response.status(200).json({ "has_permission": hasPermission })
}


export async function canGiveRole(request: Request, response: Response, client: Client) {
    const authHeader = request.headers.authorization;

    if (!authHeader || authHeader !== process.env.API_KEY) {
        return response.status(403).json({ error: "Forbidden" })
    }

    const guildId = request.params.guildId as string;
    const roleId = request.params.roleId as string;

    if (!guildId || !roleId) {
        return response.status(400).json({ error: "guildId or roleId is undefined" })
    }

    const guild = (!client.guilds.cache.get(guildId)) ? await client.guilds.fetch(guildId).catch(_ => { }) : client.guilds.cache.get(guildId);
    if (!guild) {
        return response.status(404).json({ error: "Guild not found" })
    }

    const role = (!guild.roles.cache.get(roleId)) ? await guild.roles.fetch(roleId).catch(_ => { }) : guild.roles.cache.get(roleId);
    if (!role) {
        return response.status(404).json({ error: "Role not found" })
    }

    if (!client.user) {
        return response.status(500).json({ error: "client is null (this should not happen)" })
    }
    const me = guild.members.me || await guild.members.fetch(client.user.id).catch(_ => { });
    if (!me) {
        return response.status(404).json({ error: "Client not found" })
    }

    const hasManageRoles = me.permissions.has(PermissionsBitField.Flags.ManageRoles);
    if (!hasManageRoles) {
        return response.status(200).json({ "has_permission": false })
    }

    const botHighestRole = me.roles.highest;
    if (botHighestRole.position <= role.position) {
        return response.status(200).json({ "has_permission": false })
    }

    return response.status(200).json({ "has_permission": true })
}


export async function canReactInChannel(request: Request, response: Response, client: Client) {
    const authHeader = request.headers.authorization;

    if (!authHeader || authHeader !== process.env.API_KEY) {
        return response.status(403).json({ error: "Forbidden" })
    }

    const guildId = request.params.guildId as string;
    const channelId = request.params.channelId as string;

    if (!guildId || !channelId) {
        return response.status(400).json({ error: "guildId or channelId is undefined" })
    }

    const guild = (!client.guilds.cache.get(guildId)) ? await client.guilds.fetch(guildId).catch(_ => { }) : client.guilds.cache.get(guildId);
    if (!guild) {
        return response.status(404).json({ error: "Guild not found" })
    }

    const channel = (!guild.channels.cache.get(channelId)) ? await guild.channels.fetch(channelId).catch(_ => { }) : guild.channels.cache.get(channelId);
    if (!channel || !channel.isTextBased()) {
        return response.status(404).json({ error: "Channel not found or not a text channel" })
    }

    if (!client.user) {
        return response.status(500).json({ error: "client is null (this should not happen)" })
    }
    const me = guild.members.me || await guild.members.fetch(client.user.id).catch(_ => { });
    if (!me) {
        return response.status(404).json({ error: "Client not found" })
    }
    const permissions = channel.permissionsFor(me);
    const hasPermission = permissions?.has([
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.AddReactions,
        PermissionsBitField.Flags.ReadMessageHistory, // needed for existing messages
    ]);

    return response.status(200).json({ "has_permission": hasPermission })
}


export async function canRemoveOthersReactions(request: Request, response: Response, client: Client) {
    const authHeader = request.headers.authorization;

    if (!authHeader || authHeader !== process.env.API_KEY) {
        return response.status(403).json({ error: "Forbidden" })
    }

    const guildId = request.params.guildId as string;
    const channelId = request.params.channelId as string;

    if (!guildId || !channelId) {
        return response.status(400).json({ error: "guildId or channelId is undefined" })
    }

    const guild = (!client.guilds.cache.get(guildId)) ? await client.guilds.fetch(guildId).catch(_ => { }) : client.guilds.cache.get(guildId);
    if (!guild) {
        return response.status(404).json({ error: "Guild not found" })
    }

    const channel = (!guild.channels.cache.get(channelId)) ? await guild.channels.fetch(channelId).catch(_ => { }) : guild.channels.cache.get(channelId);
    if (!channel || !channel.isTextBased()) {
        return response.status(404).json({ error: "Channel not found or not a text channel" })
    }

    if (!client.user) {
        return response.status(500).json({ error: "client is null (this should not happen)" })
    }
    const me = guild.members.me || await guild.members.fetch(client.user.id).catch(_ => { });
    if (!me) {
        return response.status(404).json({ error: "Client not found" })
    }
    const permissions = channel.permissionsFor(me);
    const hasPermission = permissions?.has([
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.ManageMessages,
    ]);

    return response.status(200).json({ "has_permission": hasPermission })
}
