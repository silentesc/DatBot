import axios from "axios";
import { Guild } from "discord.js";

export async function onGuildCreate(guild: Guild) {
    await axios.put(`${process.env.BACKEND_URL}/guild/guild`,
        {
            id: guild.id,
            name: guild.name,
            icon: guild.icon,
            bot_joined: true,
        },
        { params: { api_key: process.env.API_KEY } }
    );
    console.log(`Joined a new guild! bot_joined for guild "${guild.name}" (${guild.id}) has been set to true in the db.`);
}
