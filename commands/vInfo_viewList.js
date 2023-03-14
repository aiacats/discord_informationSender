const { SlashCommandBuilder } = require('discord.js');
const ChannelList = require('../self_module/ChannelList');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vinfo_view-list')
        .setDescription('送信リストを見ます'),
    async execute(interaction, client) {

        var channelNames = "ChannelList:";

        if(ChannelList.length >0){
            ChannelList.forEach(element => {
                channelNames += '\n' + element.toString();
            });
        }
        else{
            channelNames += '\n' + 'None';
        }

        await interaction.reply(channelNames); 
    },
};