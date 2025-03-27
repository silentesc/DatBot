import { Client, MessageReaction, PartialMessageReaction, PartialUser, User } from "discord.js";
import { reactionRoles, ReactionRoleType } from "../utils/cache";
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

    let emojiRoles: Array<EmojiRole> = [];

    let roleId;
    let type;

    for (const reactionRole of reactionRoles) {
        if (reactionRole["message_id"] === messageId) {
            emojiRoles = reactionRole["emoji_roles"] as Array<EmojiRole>;
            for (let i = 0; i < emojiRoles.length; i++) {
                const emojiRole: EmojiRole = emojiRoles[i];
                if (emojiRole["emoji"] === emoji) {
                    roleId = emojiRole["role_id"];
                }
            }
            type = reactionRole["type"] as string;
            break;
        }
    }

    if (!roleId) {
        console.error("emoji not found in reaction role, returning");
        return;
    }

    if (!type) {
        console.error("type not found in reaction role, returning");
        return;
    }

    if (!emojiRoles || emojiRoles.length <= 0) {
        console.error("no emojiRoles, returning");
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

    if (type === ReactionRoleType.UNIQUE.toString()) {
        // Remove reactions except the new one
        const emojisToRemove: Array<string> = reaction.message.reactions.cache
            .map(reaction => reaction.emoji.toString())
            .filter(e => e !== emoji);
        
        for (const emojiToRemove of emojisToRemove) {
            const reactionToRemove = reaction.message.reactions.cache.find(r => r.emoji.toString() === emojiToRemove);
            if (reactionToRemove) {
                try {
                    await reactionToRemove.users.remove(user.id);
                } catch (error) {
                    console.error(`Error removing reaction '${emojiToRemove}' from user:`, error);
                }
            }
        }

        // Remove roles
        const memberRoleIds: Array<string> = member.roles.cache.map(role => role.id);
        const reactionRoleIds: Array<string> = emojiRoles.map((emojiRole: EmojiRole) => emojiRole.role_id);

        const commonRoleIds = memberRoleIds.filter(roleId => reactionRoleIds.includes(roleId));
        
        for (let i = 0; i < commonRoleIds.length; i++) {
            const commonRoleId = commonRoleIds[i];

            try {
                await member.roles.remove(commonRoleId);
            } catch (error) {
                console.error('Error removing role from user:', error);
            }
        }
    }

    try {
        await member.roles.add(role);
    } catch (error) {
        console.error('Error adding role to user:', error);
    }
}
