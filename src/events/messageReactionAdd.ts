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

    if (user.bot) {
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
                    break;
                }
            }
            type = reactionRole["type"] as string;
            break;
        }
    }


    if (!roleId) {
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

    const role = (!reaction.message.guild.roles.cache.get(roleId)) ? await reaction.message.guild.roles.fetch(roleId).catch(_ => { }) : reaction.message.guild.roles.cache.get(roleId);
    if (!role) {
        console.error(`Role id '${roleId}' is not found in guild`);
        return;
    }

    const member = (!reaction.message.guild.members.cache.get(user.id)) ? await reaction.message.guild.members.fetch(user.id).catch(_ => { }) : reaction.message.guild.members.cache.get(user.id);
    if (!member) {
        console.error(`Member with id '${user.id}' is not found in guild`);
        return;
    }

    // Unique reaction
    if (type === ReactionRoleType.UNIQUE.toString()) {
        // Get reactions to remove
        const userReactions = reaction.message.reactions.cache
            .filter(reaction => {
                if (!reaction.users.cache.has(user.id)) {
                    return false;
                }
                if (reaction.emoji.toString() === emoji) {
                    return false;
                }
                return true;
            });

        // Remove reactions
        try {
            await Promise.all(userReactions.map(reaction => reaction.users.remove(user.id).catch(error => console.error("Error removing reaction: ", error))));
        } catch (error) {
            console.error(`Error removing reactions from user:`, error);
            await reaction.message.channel.send("❌**Error!**\nError removing reactions from user. Make sure I have the right permissions and my role is above all other roles.")
                .catch(error => {
                    console.error("Error sending message:", error);
                });
        }

        // Remove roles
        const memberRoleIds: Array<string> = member.roles.cache.map(role => role.id);
        const reactionRoleIds: Array<string> = emojiRoles.map((emojiRole: EmojiRole) => emojiRole.role_id);

        const commonRoleIds = memberRoleIds.filter(roleId => reactionRoleIds.includes(roleId));

        try {
            await Promise.all(commonRoleIds.map(roleId => member.roles.remove(roleId).catch(error => console.error("Error removing role: ", error))));
        } catch (error) {
            console.error('Error removing roles from user:', error);
            await reaction.message.channel.send("❌**Error!**\nError removing roles from user. Make sure I have the right permissions and my role is above all other roles.")
                .catch(error => {
                    console.error("Error sending message:", error);
                });
        }
    }

    try {
        // Try do add new role
        await member.roles.add(role);
    } catch (error) {
        console.error('Error adding role to user:', error);
        // Remove role because of error
        try {
            await reaction.users.remove(user.id);
        } catch (error) {
            console.error('Error removing reaction:', error);
        }
        // Send message about error
        await reaction.message.channel.send("❌**Error!**\nFailed to add role. Make sure I have the right permissions and my role is above all other roles.")
            .catch(error => {
                console.error("Error sending message:", error);
            });
    }
}
