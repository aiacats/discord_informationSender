const { SlashCommandBuilder } = require('discord.js');
const ChannelList = require('../self_module/ChannelList');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vinfo_view-list')
        .setDescription('送信リストを見ます'),
    async execute(interaction, client) {

        var channelNames = "ChannelList:";
        var channelList = ChannelList.ReadJsonList();

        if(channelList.length >0){
            channelList.forEach(element => {
                channelNames += '\n - ' + element.name;
            });
        }
        else{
            channelNames += '\n' + 'None';
        }

        await interaction.reply(channelNames); 
    },
};