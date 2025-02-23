import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { VoiceBasedChannel } from "discord.js";
import { Readable } from "stream";

export class GuildPlayer {
    private static guildPlayers: Map<string, GuildPlayer> = new Map();

    private stream: Readable | null;
    private connection: VoiceConnection | null;

    private constructor(guildId: string) {
        this.stream = null;
        this.connection = null;

        GuildPlayer.guildPlayers.set(guildId, this);
    }

    public static getGuildPlayer(guildId: string): GuildPlayer {
        const guildPlayer: GuildPlayer | undefined = this.guildPlayers.get(guildId);
        if (guildPlayer) {
            return guildPlayer;
        }
        return new GuildPlayer(guildId);
    }

    public play(stream: Readable, voiceChannel: VoiceBasedChannel) {
        console.log("play method called");

        if (this.stream) {
            console.log("Destroyed old stream");
            this.stream.destroy();
        }
        this.stream = stream;

        let connection: VoiceConnection | null = null;
        let reuseConnection: boolean = false;

        // Check for reusing connection
        if (this.connection) {
            if (this.connection.state.status === VoiceConnectionStatus.Destroyed) {
                this.connection = null;
            }
            else if (this.connection.joinConfig.channelId !== voiceChannel.id) {
                console.log("Destorying connection");
                this.connection.destroy();
                this.connection = null;
            }
            else {
                console.log("Reusing connection")
                connection = this.connection;
                reuseConnection = true;
            }
        }

        // Check if variables not initialized yet
        if (!connection) {
            console.log("Joining vc");
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator
            });
        }

        this.connection = connection;

        const player = createAudioPlayer();
        const resource = createAudioResource(stream);
        player.play(resource);
        connection.subscribe(player);

        this.registerStreamListeners(stream, player, connection);
        this.registerPlayerListeners(stream, player, connection);
        if (!reuseConnection) {
            this.registerConnectionListeners(stream, player, connection);
        }
    }

    // Register listeners

    private registerStreamListeners(stream: Readable, player: AudioPlayer, connection: VoiceConnection) {
        stream.once("error", () => {
            player.stop(true);
            if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                connection.destroy();
            }
        });
    }

    private registerPlayerListeners(stream: Readable, player: AudioPlayer, connection: VoiceConnection) {
        player.once(AudioPlayerStatus.Idle, () => {
            console.log("Player idle event");
            if (!stream.destroyed) {
                stream.destroy();
            }
            if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                connection.destroy();
            }
        });

        player.once("error", () => {
            console.log("Player error event");
            if (!stream.destroyed) {
                stream.destroy();
            }
            if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                connection.destroy();
            }
        });
    }

    private registerConnectionListeners(stream: Readable, player: AudioPlayer, connection: VoiceConnection) {
        connection.once(VoiceConnectionStatus.Disconnected, () => {
            console.log("Connection disconnected event");
            if (!stream.destroyed) {
                stream.destroy();
            }
            player.stop(true);
        });

        connection.once("error", () => {
            console.log("Connection error event");
            if (!stream.destroyed) {
                stream.destroy();
            }
            player.stop(true);
        });
    }
}
