import { Client, MessageReaction, PartialMessageReaction, PartialUser, User } from "discord.js";
import { reactionRoles } from "../utils/cache";
import { EmojiRole } from "../api/models";


export async function onMessageReactionRemove(client: Client, reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
    if (reaction.partial) {
        try {
            reaction = await reaction.fetch();
        } catch (error) {
            console.error('Error fetching reaction:', error);
            return;
        }
    }

    if (user.partial) {
        try {
            user = await user.fetch();
        } catch (error) {
            console.error('Error fetching user:', error);
            return;
        }
    }

    if (!reaction.message.inGuild()) {
        return;
    }

    if (user.bot) {
        return;
    }

    const emoji: string = reaction.emoji.toString();
    const messageId: string = reaction.message.id;

    let roleId = null;

    for (const reactionRole of reactionRoles) {
        if (reactionRole["message_id"] === messageId) {
            const emojiRoles: Array<EmojiRole> = reactionRole["emoji_roles"] as Array<EmojiRole>;
            for (let i = 0; i < emojiRoles.length; i++) {
                const emojiRole = emojiRoles[i];
                if (emojiRole["emoji"] === emoji) {
                    roleId = emojiRole["role_id"];
                    break;
                }
            }
            break;
        }
    }

    if (!roleId) {
        return;
    }

    const role = (!reaction.message.guild.roles.cache.get(roleId)) ? await reaction.message.guild.roles.fetch(roleId).catch(_ => {}) : reaction.message.guild.roles.cache.get(roleId);
    if (!role) {
        console.error(`Role id '${roleId}' is not found in guild`);
        return;
    }

    const member = (!reaction.message.guild.members.cache.get(user.id)) ? await reaction.message.guild.members.fetch(user.id).catch(_ => {}) : reaction.message.guild.members.cache.get(user.id);
    if (!member) {
        console.error(`Member with id '${user.id}' is not found in guild`);
        return;
    }

    try {
        await member.roles.remove(role);
    } catch (error) {
        console.error('Error adding role to user:', error);
    }
}
