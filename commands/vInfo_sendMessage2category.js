const { SlashCommandBuilder, ChannelType } = require('discord.js');
//const ChannelList = require('../self_module/ChannelList');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vinfo_send-message')
        .setDescription('指定のカテゴリ内のチャンネル全てにメッセージを送ります')
        .addChannelOption((option) =>
            option
                .setName('category')
                .setDescription('送信するカテゴリを選択')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildCategory)
        )
        .addStringOption((option) =>
            option
                .setName('message_id')
                .setDescription('送信するメッセージのIDを入力')
                .setRequired(true)
        ),
    async execute(interaction, client) {

        const baseChannel = client.channels.cache.get('1084601052076199997'); // bot-messageチャンネル
        const sendMessageID = interaction.options.getString('message_id');
        const sendMessage = (await baseChannel.messages.fetch(sendMessageID)).content;

        const category = interaction.options.getChannel('category');
        const channelList = category.children.cache;

        if(channelList.size >0){
            
            channelList.forEach(element => {
                client.channels.cache.get(element.id).send(sendMessage);
            });
        }
        else{
            await interaction.reply(channelList.size);
        }

        await interaction.reply('Message send ' + sendMessageID );
    },
};