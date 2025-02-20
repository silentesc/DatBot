import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { VoiceBasedChannel } from "discord.js";
import { Readable } from "stream";

export class GuildPlayer {
    private static guildPlayers: Map<string, GuildPlayer> = new Map();

    private guildId: string;
    private prevStream: Readable | null;
    private prevPlayer: AudioPlayer | null;
    private prevConnection: VoiceConnection | null;

    private constructor(guildId: string) {
        this.guildId = guildId;
        this.prevStream = null;
        this.prevPlayer = null;
        this.prevConnection = null;

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
        let player: AudioPlayer | null = null;
        let connection: VoiceConnection | null = null;

        let listenForPlayer: boolean = true;
        let listenForConnection: boolean = true;

        // Check prev variables
        if (this.prevStream) {
            if (!this.prevStream.destroyed) {
                console.log("Destorying prevStream");
                this.prevStream.destroy();
            }
            this.prevStream = null;
        }
        if (this.prevPlayer) {
            player = this.prevPlayer;
            listenForPlayer = false;
        }
        if (this.prevConnection) {
            if (this.prevConnection.state.status === VoiceConnectionStatus.Destroyed) {
                this.prevConnection = null;
            }
            else if (this.prevConnection.joinConfig.channelId !== voiceChannel.id) {
                this.prevConnection.destroy();
                this.prevConnection = null;
            }
            else {
                connection = this.prevConnection;
                listenForConnection = false;
            }
        }

        // Check if variables not initialized yet
        if (!player) {
            player = createAudioPlayer();
        }
        if (!connection) {
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator
            });
        }

        const resource = createAudioResource(stream);
        player.play(resource);
        connection.subscribe(player);

        if (listenForPlayer) {
            this.createPlayerListeners(connection, player, stream);
        }
        if (listenForConnection) {
            this.createConnectionListeners(connection, player, stream);
        }

        this.prevStream = stream;
        this.prevPlayer = player;
        this.prevConnection = connection;

        console.log("Started stream, player, connection");
    }

    /**
     * Private utils
     */

    private createPlayerListeners(connection: VoiceConnection, player: AudioPlayer, stream: Readable): void {
        player.once(AudioPlayerStatus.Idle, () => {
            if (!stream.destroyed) {
                console.log("Destroying stream");
                stream.destroy();
            }

            if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                console.log("Destorying connection");
                connection.destroy();
            }
        });

        player.once('error', (error) => {
            console.error('Error playing audio:', error);

            player.stop(true);

            if (!stream.destroyed) {
                console.log("Destroying stream");
                stream.destroy();
            }

            if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                console.log("Destroying connection");
                connection.destroy();
            }
        });
    }

    private createConnectionListeners(connection: VoiceConnection, player: AudioPlayer, stream: Readable): void {
        connection.once(VoiceConnectionStatus.Disconnected, () => {
            player.stop(true);

            if (!stream.destroyed) {
                console.log("Destroying stream");
                stream.destroy();
            }

            if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                console.log("Destroying connection");
                connection.destroy();
            }
        });

        connection.once("error", (error) => {
            console.error('Error on connection:', error);

            player.stop(true);

            if (!stream.destroyed) {
                console.log("Destroying stream");
                stream.destroy();
            }

            if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                console.log("Destroying connection");
                connection.destroy();
            }
        });
    }
}
