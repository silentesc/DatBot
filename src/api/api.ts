import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { Client } from "discord.js";
import "dotenv/config";

import { getGuilds } from "./services/guildService";

const apiKey = process.env.API_KEY;
const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(express.json());

export function invokeApi(client: Client) {
    app.get("/guilds", async (request: Request, response: Response) => {
        getGuilds(request, response, client);
    });

    app.listen(port, () => {
        console.log(`Started express API on port ${port}`)
    });
}
