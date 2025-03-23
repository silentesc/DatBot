import { Client, MessageReaction, PartialMessageReaction, PartialUser, User } from "discord.js";
import { reactionRoles } from "../utils/cache";
import { EmojiRole } from "../api/models";


export async function onMessageReactionAdd(client: Client, reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
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
        console.error("emoji not found in reaction role, returning");
        return;
    }

    const role = (!reaction.message.guild.roles.cache.get(roleId)) ? await reaction.message.guild.roles.fetch(roleId) : reaction.message.guild.roles.cache.get(roleId);
    if (!role) {
        console.error(`Role id '${roleId}' is not found in guild`);
        return;
    }

    const member = (!reaction.message.guild.members.cache.get(user.id)) ? await reaction.message.guild.members.fetch(user.id) : reaction.message.guild.members.cache.get(user.id);
    if (!member) {
        console.error(`Member with id '${user.id}' is not found in guild`);
        return;
    }

    try {
        await member.roles.add(role);
    } catch (error) {
        console.error('Error adding role to user:', error);
    }
}
