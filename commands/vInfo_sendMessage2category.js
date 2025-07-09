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
        try {
            const baseChannel = client.channels.cache.get('1084601052076199997'); // bot-messageチャンネル
            const sendMessageID = interaction.options.getString('message_id');
            
            // メッセージ全体を取得（テキスト、添付ファイル、埋め込みを含む）
            const originalMessage = await baseChannel.messages.fetch(sendMessageID);
            
            const category = interaction.options.getChannel('category');
            const channelList = category.children.cache;

            if (channelList.size > 0) {
                // メッセージオブジェクトを構築
                const messageOptions = {};
                
                // テキスト部分があれば追加
                if (originalMessage.content) {
                    messageOptions.content = originalMessage.content;
                }
                
                // 埋め込み（Embed）があれば追加
                if (originalMessage.embeds && originalMessage.embeds.length > 0) {
                    messageOptions.embeds = originalMessage.embeds;
                }
                
                // 添付ファイル（画像、動画など）があれば追加
                if (originalMessage.attachments && originalMessage.attachments.size > 0) {
                    messageOptions.files = Array.from(originalMessage.attachments.values()).map(attachment => ({
                        attachment: attachment.url,
                        name: attachment.name
                    }));
                }
                
                // 各チャンネルに送信
                const sendPromises = [];
                channelList.forEach(element => {
                    if (element.isTextBased()) {
                        sendPromises.push(
                            client.channels.cache.get(element.id).send(messageOptions)
                                .catch(error => {
                                    console.error(`チャンネル ${element.name} への送信エラー:`, error);
                                    return { error: true, channel: element.name, message: error.message };
                                })
                        );
                    }
                });
                
                // 全ての送信を並行実行
                const results = await Promise.all(sendPromises);
                const errors = results.filter(result => result && result.error);
                
                if (errors.length > 0) {
                    await interaction.reply({
                        content: `メッセージを送信しました（${sendPromises.length - errors.length}/${sendPromises.length}件成功）\n` +
                                `エラーが発生したチャンネル: ${errors.map(e => e.channel).join(', ')}`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: `メッセージ（ID: ${sendMessageID}）をカテゴリ「${category.name}」内の${sendPromises.length}個のチャンネルに送信しました。`,
                        ephemeral: true
                    });
                }
            } else {
                await interaction.reply({
                    content: `カテゴリ「${category.name}」にはテキストチャンネルがありません。`,
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('メッセージ送信エラー:', error);
            
            if (error.code === 10008) {
                await interaction.reply({
                    content: '指定されたメッセージIDが見つかりません。正しいメッセージIDを入力してください。',
                    ephemeral: true
                });
            } else if (error.code === 50013) {
                await interaction.reply({
                    content: '一部のチャンネルに送信する権限がありません。',
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: 'メッセージの送信中にエラーが発生しました。管理者にお問い合わせください。',
                    ephemeral: true
                });
            }
        }
    },
};