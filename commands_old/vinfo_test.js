const { SlashCommandBuilder, ChannelType } = require('discord.js');
//const ChannelList = require('../self_module/ChannelList');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vinfo_test')
        .setDescription('test')
        .addStringOption((option) =>
            option
                .setName('messageid')
                .setDescription('送信するメッセージのIDを入力')
                .setRequired(true)
        ),
    async execute(interaction, client) {

        const sendMessageID = interaction.options.getString('messageid');
        const baseChannel = client.channels.cache.get('1084601052076199997');
        const sendMessage = (await baseChannel.messages.fetch(sendMessageID)).content;

        await interaction.reply('Message send : ' + sendMessage );
    },
};