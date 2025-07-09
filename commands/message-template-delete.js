const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('message-template-delete')
        .setDescription('保存されたメッセージテンプレートを削除します')
        .addStringOption(option =>
            option
                .setName('template')
                .setDescription('削除するテンプレート名またはID')
                .setRequired(true)
                .setAutocomplete(true)
        ),
    
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const templatesPath = path.join(__dirname, '../data/message-templates.json');
        
        if (!fs.existsSync(templatesPath)) {
            await interaction.respond([]);
            return;
        }
        
        const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
        const choices = Object.values(templates).map(template => ({
            name: `${template.name} (${template.category})`,
            value: template.id
        }));
        
        const filtered = choices.filter(choice => 
            choice.name.toLowerCase().includes(focusedValue.toLowerCase())
        );
        
        await interaction.respond(filtered.slice(0, 25));
    },
    
    async execute(interaction) {
        const templateInput = interaction.options.getString('template');
        const templatesPath = path.join(__dirname, '../data/message-templates.json');
        
        // テンプレートファイルが存在しない場合
        if (!fs.existsSync(templatesPath)) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('エラー')
                .setDescription('テンプレートファイルが見つかりません。')
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        
        // テンプレートを読み込み
        const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
        
        // テンプレートを検索（IDまたは名前で）
        let templateId = templateInput;
        let template = templates[templateInput];
        
        if (!template) {
            // 名前で検索
            const foundTemplate = Object.entries(templates).find(([id, t]) => t.name === templateInput);
            if (foundTemplate) {
                templateId = foundTemplate[0];
                template = foundTemplate[1];
            }
        }
        
        if (!template) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('エラー')
                .setDescription(`テンプレート「${templateInput}」が見つかりません。`)
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        
        // 削除権限の確認（作成者または管理者のみ）
        const isCreator = template.createdBy === interaction.user.id;
        const isAdmin = interaction.member.permissions.has('Administrator');
        
        if (!isCreator && !isAdmin) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('権限エラー')
                .setDescription('このテンプレートを削除する権限がありません。\n作成者または管理者のみが削除できます。')
                .addFields({
                    name: '作成者',
                    value: template.createdByName || '不明'
                })
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        
        // 確認メッセージ
        const confirmEmbed = new EmbedBuilder()
            .setColor(0xFF6B6B)
            .setTitle('テンプレート削除の確認')
            .setDescription(`本当に「${template.name}」を削除しますか？\n\n**この操作は取り消せません。**`)
            .addFields(
                { name: 'テンプレート名', value: template.name, inline: true },
                { name: 'カテゴリー', value: template.category, inline: true },
                { name: '使用回数', value: `${template.usageCount || 0}回`, inline: true },
                { name: '作成日', value: new Date(template.createdAt).toLocaleDateString('ja-JP'), inline: true },
                { name: '作成者', value: template.createdByName || '不明', inline: true }
            );
        
        // プレビュー
        const preview = template.content.length > 200 
            ? template.content.substring(0, 200) + '...' 
            : template.content;
        confirmEmbed.addFields({
            name: 'プレビュー',
            value: `\`\`\`${preview}\`\`\``
        });
        
        // ボタンコンポーネント
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`delete_template_${templateId}`)
                    .setLabel('削除する')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cancel_delete')
                    .setLabel('キャンセル')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        const response = await interaction.reply({
            embeds: [confirmEmbed],
            components: [row],
            ephemeral: true
        });
        
        // ボタンの応答を待機
        const collectorFilter = i => i.user.id === interaction.user.id;
        
        try {
            const confirmation = await response.awaitMessageComponent({ 
                filter: collectorFilter, 
                time: 30000 
            });
            
            if (confirmation.customId === `delete_template_${templateId}`) {
                // テンプレートを削除
                delete templates[templateId];
                
                // ファイルに保存
                fs.writeFileSync(templatesPath, JSON.stringify(templates, null, 2));
                
                // 成功メッセージ
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('削除完了')
                    .setDescription(`テンプレート「${template.name}」を削除しました。`)
                    .setTimestamp();
                
                await confirmation.update({ 
                    embeds: [successEmbed], 
                    components: [] 
                });
                
            } else {
                // キャンセル
                const cancelEmbed = new EmbedBuilder()
                    .setColor(0x95A5A6)
                    .setTitle('キャンセルしました')
                    .setDescription(`テンプレート「${template.name}」の削除をキャンセルしました。`)
                    .setTimestamp();
                
                await confirmation.update({ 
                    embeds: [cancelEmbed], 
                    components: [] 
                });
            }
            
        } catch (error) {
            // タイムアウト
            const timeoutEmbed = new EmbedBuilder()
                .setColor(0x95A5A6)
                .setTitle('タイムアウト')
                .setDescription('削除確認がタイムアウトしました。操作をキャンセルします。')
                .setTimestamp();
            
            await interaction.editReply({ 
                embeds: [timeoutEmbed], 
                components: [] 
            });
        }
    },
};