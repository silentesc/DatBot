import axios from "axios";
import { GuildMember } from "discord.js";
import { WelcomeMessage } from "../api/models";

export async function onGuildMemberAdd(member: GuildMember) {
    const response = await axios.get(`${process.env.BACKEND_URL}/welcome_message/welcome_message`, { params: { api_key: process.env.API_KEY, guild_id: member.guild.id } })
        .catch((error) => {
            console.error("Failed to get welcome message for guild on event onGuildMemberAdd", error);
        });

    if (!response) {
        console.error("Response is undefined");
        return;
    }

    const welcomeMessage: WelcomeMessage = response.data;

    const channel = await member.guild.channels.fetch(welcomeMessage.channel.id)
        .catch((error) => console.error("Error while fetching channel on event onGuildMemberAdd", error));

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
