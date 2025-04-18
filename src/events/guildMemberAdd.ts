import axios from "axios";
import { GuildMember } from "discord.js";
import { Role, WelcomeMessage } from "../api/models";

export async function onGuildMemberAdd(member: GuildMember) {
    // Don't use await to do everything simultaneously
    handleWelcomeMessage(member);
    handleAutoRoles(member);
}

async function handleWelcomeMessage(member: GuildMember) {
    const response = await axios.get(`${process.env.BACKEND_URL}/welcome_message/welcome_message`, { params: { api_key: process.env.API_KEY, guild_id: member.guild.id } })
        .catch((error) => {
            console.error("Failed to get welcome message for guild on event onGuildMemberAdd", error);
        });

    if (!response) {
        return;
    }

    const welcomeMessage: WelcomeMessage = response.data;

    if (!welcomeMessage) {
        return;
    }

    const channel = (!member.guild.channels.cache.get(welcomeMessage.channel.id))
        ? await member.guild.channels.fetch(welcomeMessage.channel.id).catch((error) => console.error("Error while fetching channel on event onGuildMemberAdd", error))
        : member.guild.channels.cache.get(welcomeMessage.channel.id);

    if (!channel) {
        console.error("Channel on event onGuildMemberAdd is null");
        return;
    }

    if (channel.isSendable()) {
        const msg = welcomeMessage.message.replace("{mention}", `<@${member.id}>`).replace("{username}", member.user.username).replace("{server_name}", member.guild.name);
        await channel.send(msg)
            .catch((error) => { console.error("Error while sending message into channel on event onGuildMemberAdd", error) });
    }
}

async function handleAutoRoles(member: GuildMember) {
    const response = await axios.get(`${process.env.BACKEND_URL}/auto_role/auto_roles`, { params: { api_key: process.env.API_KEY, guild_id: member.guild.id } })
        .catch((error) => {
            console.error("Failed to get welcome message for guild on event onGuildMemberAdd", error);
        });

    if (!response) {
        return;
    }

    const autoRoles: Array<Role> = response.data;

    for (const autoRole of autoRoles) {
        member.roles.add(autoRole.id)
            .catch(error => console.error("Error while adding role to member: ", error));
    }
}
