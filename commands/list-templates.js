const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const GoogleDriveManager = require('../self_module/GoogleDriveManager');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list-templates')
        .setDescription('利用可能なプロジェクトテンプレート一覧を表示します'),
    async execute(interaction, client) {
        try {
            // 全テンプレート読み込み
            const allTemplates = GoogleDriveManager.getAllTemplates();

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('利用可能なテンプレート一覧')
                .setDescription('プロジェクト作成時に使用できるテンプレートです')
                .setTimestamp();

            // 全テンプレートを統一して表示
            if (Object.keys(allTemplates).length > 0) {
                let templateList = '';
                for (const [key, template] of Object.entries(allTemplates)) {
                    const createdDate = template.createdAt ? ` - 作成日: ${new Date(template.createdAt).toLocaleDateString('ja-JP')}` : '';
                    templateList += `**${template.name}** (\`${key}\`)${createdDate}\n`;
                }
                embed.addFields({ name: '📋 テンプレート', value: templateList });
            } else {
                embed.addFields({ 
                    name: '📋 テンプレート', 
                    value: 'まだテンプレートがありません。\n`/scan-folder`コマンドで作成できます。' 
                });
            }

            embed.setFooter({ 
                text: 'すべてのテンプレートは /create-project コマンドで使用できます' 
            });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('テンプレート一覧取得エラー:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('エラーが発生しました')
                .setDescription('テンプレート一覧の取得中にエラーが発生しました。')
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed] });
        }
    },
};