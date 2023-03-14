const { SlashCommandBuilder } = require('discord.js');
const ChannelList = require('../self_module/ChannelList');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vinfo_send-message')
        .setDescription('送信リストに登録しているチャンネルにメッセージを送ります')
        .addStringOption((option) =>
            option
                .setName('message')
                .setDescription('送信するメッセージを入力')
                .setRequired(true)
        ),
    async execute(interaction, client) {

        const message = interaction.options.getString('message');

        if(ChannelList.length >0){
            ChannelList.forEach(element => {
                client.channels.cache.get(element.id).send(message);
            });               
        }

        await interaction.reply('Message send.');
    },
};