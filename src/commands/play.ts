import { Client, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } from "@discordjs/voice";
import ytdl from "@distube/ytdl-core";
// @ts-ignore
import ytSearch from "yt-search";


module.exports = {
    execute: async (client: Client, interaction: ChatInputCommandInteraction) => {
        let input = interaction.options.get("input")?.value;
        const responseEmbed = new EmbedBuilder().setColor(0x4c8afb);

        if (!input || !(typeof input === 'string')) {
            responseEmbed.setDescription("Input cannot be empty!");
            await interaction.reply({ embeds: [responseEmbed] });
            return;
        }

        input = input.trim();

        // Get video
        const searchResult = await ytSearch(input);
        const video = searchResult.videos.length > 0 ? searchResult.videos[0] : null;

        if (!video) {
            responseEmbed.setDescription("Could not find any results for that input.")
            await interaction.reply({ embeds: [responseEmbed] });
            return;
        }

        const title = video.title;
        const url = video.url;
        const timestamp = video.timestamp;
        const thumbnail = video.thumbnail;
        const authorName = video.author.name;

        // Get guild, member, voice channel
        const guildId = interaction.guildId;
        if (!guildId) {
            console.error("interaction.guildId is null");
            responseEmbed.setDescription("An error occured.");
            await interaction.reply({ embeds: [responseEmbed] });
            return;
        }

        const interactionMember = interaction.member;
        if (!interactionMember) {
            console.error("interaction.member is null");
            responseEmbed.setDescription("An error occured.");
            await interaction.reply({ embeds: [responseEmbed] });
            return;
        }

        let guild = client.guilds.cache.get(guildId);
        if (!guild) {
            console.log("guildId not in cache, trying to fetch.")
            guild = await client.guilds.fetch(guildId);
        }

        let member = guild.members.cache.get(interactionMember.user.id);
        if (!member) {
            console.log("member not in cache, trying to fetch.")
            member = await guild.members.fetch(interaction.user.id);
        }

        const voiceChannel = member.voice.channel;

        // Check if user in voice channel
        if (!voiceChannel) {
            responseEmbed.setDescription("You need to be in a voice channel to play music!");
            await interaction.reply({ embeds: [responseEmbed] });
            return;
        }

        // Join voice channel
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator
        });


        try {
            // Stream the audio from YouTube.
            const stream = ytdl(url, { filter: "audioonly", quality: "highestaudio", highWaterMark: 1 << 25 });
            const resource = createAudioResource(stream);

            // Create an audio player.
            const player = createAudioPlayer();
            player.play(resource);
            connection.subscribe(player);

            // Listeners for player
            player.on(AudioPlayerStatus.Idle, () => {
                connection.destroy();
                stream.destroy();
            });

            player.on('error', (error) => {
                console.error('Error playing audio:', error);
                connection.destroy();
                stream.destroy();
            });

            // Listeners for connection
            connection.on(VoiceConnectionStatus.Disconnected, () => {
                player.stop();
                stream.destroy();
            });

            responseEmbed.setThumbnail(thumbnail);
            responseEmbed.addFields(
                { name: "Title", value: title, inline: false },
                { name: "Channel", value: authorName, inline: false },
                { name: "Duration", value: timestamp, inline: false },
                { name: "URL", value: url, inline: false },
            );
        } catch (error) {
            console.error("Error playing the audio:", error);
            responseEmbed.setDescription("There was an error playing that song.");
            connection.destroy();
        }

        await interaction.reply({ embeds: [responseEmbed] });
    },
};
