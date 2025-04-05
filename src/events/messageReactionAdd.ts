import { Client, MessageReaction, PartialMessageReaction, PartialUser, User } from "discord.js";
import { reactionRoles, ReactionRoleType } from "../utils/cache";
import { EmojiRole } from "../api/models";


export async function onMessageReactionAdd(client: Client, reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
    const now = Date.now();
    console.log(Date.now() - now, "Event received");
    if (reaction.partial) {
        try {
            console.log(Date.now() - now, "Reaction partial, fetching...");
            reaction = await reaction.fetch();
            console.log(Date.now() - now, "Fetched reaction successfully.");
        } catch (error) {
            console.error('Error fetching reaction:', error);
            return;
        }
    }

    if (user.partial) {
        try {
            console.log(Date.now() - now, "User partial, fetching...");
            user = await user.fetch();
            console.log(Date.now() - now, "Fetched user successfully.");
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

    console.log(Date.now() - now, "Searching for role in reactionRoles...");
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
    console.log(Date.now() - now, "Search finished.");


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

    console.log(Date.now() - now, "Getting role...");
    const role = (!reaction.message.guild.roles.cache.get(roleId)) ? await reaction.message.guild.roles.fetch(roleId).catch(_ => { }) : reaction.message.guild.roles.cache.get(roleId);
    console.log(Date.now() - now, "Got role.");
    if (!role) {
        console.error(`Role id '${roleId}' is not found in guild`);
        return;
    }

    console.log(Date.now() - now, "Getting member...");
    const member = (!reaction.message.guild.members.cache.get(user.id)) ? await reaction.message.guild.members.fetch(user.id).catch(_ => { }) : reaction.message.guild.members.cache.get(user.id);
    console.log(Date.now() - now, "Got member.");
    if (!member) {
        console.error(`Member with id '${user.id}' is not found in guild`);
        return;
    }

    if (type === ReactionRoleType.UNIQUE.toString()) {
        // Remove reactions except the new one
        console.log(Date.now() - now, "Getting emojis to remove...");
        const emojisToRemove: Array<string> = reaction.message.reactions.cache
            .map(reaction => reaction.emoji.toString())
            .filter(e => e !== emoji);
        console.log(Date.now() - now, "Got emojis to remove.");

        console.log(Date.now() - now, "Removing reactions...");
        for (const emojiToRemove of emojisToRemove) {
            const reactionToRemove = reaction.message.reactions.cache.find(r => r.emoji.toString() === emojiToRemove);
            if (reactionToRemove) {
                try {
                    console.log(Date.now() - now, "Removing reaction", reactionToRemove.emoji);
                    await reactionToRemove.users.remove(user.id);
                    console.log(Date.now() - now, "Removed reaction", reactionToRemove.emoji);
                } catch (error) {
                    console.error(`Error removing reaction '${emojiToRemove}' from user:`, error);
                }
            }
        }
        console.log(Date.now() - now, "Removed all reactions.");

        // Remove roles
        const memberRoleIds: Array<string> = member.roles.cache.map(role => role.id);
        const reactionRoleIds: Array<string> = emojiRoles.map((emojiRole: EmojiRole) => emojiRole.role_id);

        const commonRoleIds = memberRoleIds.filter(roleId => reactionRoleIds.includes(roleId));

        console.log(Date.now() - now, "Removing all roles...");
        for (let i = 0; i < commonRoleIds.length; i++) {
            const commonRoleId = commonRoleIds[i];

            try {
                console.log(Date.now() - now, "Removing role", commonRoleId);
                await member.roles.remove(commonRoleId);
                console.log(Date.now() - now, "Removed role", commonRoleId);
            } catch (error) {
                console.error('Error removing role from user:', error);
            }
        }
        console.log(Date.now() - now, "Removed all roles.");
    }

    try {
        console.log(Date.now() - now, "Adding role...");
        await member.roles.add(role);
        console.log(Date.now() - now, "Added role.");
    } catch (error) {
        console.error('Error adding role to user:', error);
    }

    console.log(Date.now() - now, "Done.");
    console.log("");
}
