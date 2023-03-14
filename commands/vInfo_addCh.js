const { SlashCommandBuilder, ChannelType } = require('discord.js');
const ChannelList = require('../self_module/ChannelList');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vinfo_add-ch')
        .setDescription('チャンネルを送信リストに追加します')
        .addChannelOption((option) =>
            option  
                .setName('channel')
                .setDescription('追加するチャンネルを選択')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
                ),
    async execute(interaction) {

        const addChannel = interaction.options.getChannel('channel');

        ChannelList.push(addChannel);
        
        var message = "Add :" + String(addChannel);   
        await interaction.reply(message); 
    },
};