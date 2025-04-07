import axios from "axios";
import { Guild } from "discord.js";

export async function onGuildDelete(guild: Guild) {
    await axios.put(`${process.env.BACKEND_URL}/guild/guild`,
        {
            id: guild.id,
            name: guild.name,
            icon: guild.icon,
            bot_joined: false,
        },
        { params: { api_key: process.env.API_KEY } }
    );
    console.log(`Left a guild! bot_joined for guild "${guild.name}" (${guild.id}) has been set to false in the db.`);
}
