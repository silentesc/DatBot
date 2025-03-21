import express from "express";
import { Request, Response } from "express";
import bodyParser from "body-parser";
import { Client } from "discord.js";
import "dotenv/config";

import { getChannels, getGuilds, getRoles } from "./services/guildService";

const app = express();
const port = 3001;

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

    app.listen(port, () => {
        console.log(`Started express API on port ${port}`)
    });
}
