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
        var channelList = ChannelList.ReadJsonList();

        var removechannel = channelList.find(element =>{
            return element.id == interaction.options.getChannel('channel').id;
        })

        if(removechannel != null){
            var id = channelList.indexOf(removechannel);
            ChannelList.RemoveChannel(id);
            
            message = "Remove :" + String(removechannel.name);            
        }      
        else{
            message = "Can't find."
        }  
        await interaction.reply(message); 
    },
};