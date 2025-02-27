const { REST, Routes, ApplicationCommandOptionType } = require("discord.js");
require("dotenv").config();


const commands = [
    {
        name: "ping",
        description: "Shows the client & websocket latency.",
    },
    {
        name: "help",
        description: "Displays the Help Page.",
        options: [
            {
                name: "command",
                description: "The specific command to view.",
                type: ApplicationCommandOptionType.String,
                choices: [
                    {
                        name: "help",
                        value: "help",
                    },
                    {
                        name: "ping",
                        value: "ping",
                    },
                ]
            }
        ]
    },
    {
        name: "play",
        description: "Plays the given music.",
        options: [
            {
                name: "input",
                description: "The url or name of the song.",
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
    }
];

async function main() {
    await deleteAllCommands(false, false);
    // await registerCommands(process.env.GUILD_ID);
    await registerCommands();
}

main();


/**
 * Functions
 */


async function deleteAllCommands(globalCommands, guildCommands) {
    console.log(`globalCommands: ${globalCommands} guildCommands: ${guildCommands}`)
    try {
        const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

        if (globalCommands) {
            // Fetch global commands and delete them
            const globalCommands = await rest.get(Routes.applicationCommands(process.env.CLIENT_ID));
            for (const command of globalCommands) {
                await rest.delete(Routes.applicationCommand(process.env.CLIENT_ID, command.id));
                console.log(`Deleted global command: ${command.name}`);
            }
        }

        if (guildCommands) {
            // Fetch guild-specific commands and delete them
            const guildCommands = await rest.get(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID));
            for (const command of guildCommands) {
                await rest.delete(Routes.applicationGuildCommand(process.env.CLIENT_ID, process.env.GUILD_ID, command.id));
                console.log(`Deleted guild command: ${command.name}`);
            }
        }

    } catch (error) {
        console.error('Error deleting commands:', error);
    }
}


async function registerCommands(guildId = null) {
    (async () => {
        try {
            const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
            console.log("Registering slash commands.");

            if (guildId) {
                await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
            }
            else {
                await rest.put(Routes.applicationCommands(process.env.CLIENT_ID, guildId), { body: commands });
            }

            console.log("Slash commands have been registered.");
        } catch (error) {
            console.error(error);
        }
    })();
}
