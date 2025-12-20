import express from "express";
import { Request, Response } from "express";
import bodyParser from "body-parser";
import { Client } from "discord.js";
import "dotenv/config";

import { getChannels, getGuilds, getRoles } from "./services/guildService";
import { createReactionRole, deleteReactionRole } from "./services/reactionRolesService";
import { canGiveRole, canReactInChannel, canSendMessagesInChannel } from "./services/permissionsService";

const app = express();
const port = process.env.PORT;

app.use(bodyParser.json());
app.use(express.json());

export function invokeApi(client: Client) {
    app.get("/guilds", async (request: Request, response: Response) => {
        await getGuilds(request, response, client);
    });

    app.get("/guilds/:guildId/channels", async (request: Request, response: Response) => {
        await getChannels(request, response, client);
    });

    app.get("/guilds/:guildId/roles", async (request: Request, response: Response) => {
        await getRoles(request, response, client);
    });

    app.post("/reaction_roles/:guildId/:channelId", async (request: Request, response: Response) => {
        await createReactionRole(request, response, client);
    });

    app.delete("/reaction_roles/:guildId/:channelId/:messageId", async (request: Request, response: Response) => {
        await deleteReactionRole(request, response, client);
    });

    app.get("/permissions/send_messages/:guildId/:channelId", async (request: Request, response: Response) => {
        await canSendMessagesInChannel(request, response, client);
    });

    app.get("/permissions/give_role/:guildId/:roleId", async (request: Request, response: Response) => {
        await canGiveRole(request, response, client);
    });

    app.get("/permissions/react/:guildId/:channelId", async (request: Request, response: Response) => {
        await canReactInChannel(request, response, client);
    });

    app.get("/permissions/remove_others_reactions/:guildId/:channelId", async (request: Request, response: Response) => {
        await canReactInChannel(request, response, client);
    });

    app.listen(port, () => {
        console.log(`Started express API on port ${port}`)
    });
}
