import axios from "axios";
import { GuildMember, PartialGuildMember } from "discord.js";
import { LeaveMessage } from "../api/models";

export async function onGuildMemberRemove(member: GuildMember | PartialGuildMember) {
    // Don't use await to do everything simultaneously
    handleLeaveMessage(member);
}

async function handleLeaveMessage(member: GuildMember | PartialGuildMember) {
    if (member.partial) {
        try {
            member = await member.fetch();
        } catch (error) {
            console.error('Error fetching member:', error);
            return;
        }
    }

    const response = await axios.get(`${process.env.BACKEND_URL}/leave_message/leave_message`, { params: { api_key: process.env.API_KEY, guild_id: member.guild.id } })
        .catch((error) => {
            console.error("Failed to get leave message for guild on event onGuildMemberRemove", error);
        });

    if (!response) {
        return;
    }

    const leaveMessage: LeaveMessage = response.data;

    if (!leaveMessage) {
        return;
    }

    const channel = (!member.guild.channels.cache.get(leaveMessage.channel.id))
        ? await member.guild.channels.fetch(leaveMessage.channel.id).catch((error) => console.error("Error while fetching channel on event onGuildMemberRemove", error))
        : member.guild.channels.cache.get(leaveMessage.channel.id);

    if (!channel) {
        console.error("Channel on event onGuildMemberRemove is null");
        return;
    }

    if (channel.isSendable()) {
        const msg = leaveMessage.message.replace("{mention}", `<@${member.id}>`).replace("{username}", member.user.username).replace("{server_name}", member.guild.name);
        await channel.send(msg)
            .catch((error) => { console.error("Error while sending message into channel on event onGuildMemberRemove", error) });
    }
}
