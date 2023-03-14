const { SlashCommandBuilder, ChannelType } = require('discord.js');
const ChannelList = require('../self_module/ChannelList');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vinfo_remove-ch')
        .setDescription('チャンネルを送信リストから削除します')
        .addChannelOption((option) =>
            option  
                .setName('channel')
                .setDescription('削除するチャンネルを選択')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
                ),
    async execute(interaction) {

        var message = "";

        var removechannel = ChannelList.find(element =>{
            return element == interaction.options.getChannel('channel');
        })

        if(removechannel != null){
            var id = ChannelList.indexOf(removechannel);
            ChannelList.splice(id, 1);
            
            message = "Remove :" + String(removechannel);            
        }      
        else{
            message = "Can't find."
        }  
        await interaction.reply(message); 
    },
};