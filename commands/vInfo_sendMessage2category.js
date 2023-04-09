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
                .setName('message')
                .setDescription('送信するメッセージを入力')
                .setRequired(true)
        ),
    async execute(interaction, client) {

        const sendMessage = interaction.options.getString('message');

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

        await interaction.reply('Message send : ' + sendMessage );
    },
};