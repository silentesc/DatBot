import { ActivityType, Client } from "discord.js";


export function setActivity(client: Client) {
    if (!client.user) {
        console.error("Failed to set activity. Client user is undefined.");
        return;
    }
    client.user.setActivity({
        name: "/help",
        type: ActivityType.Watching
    });
}
