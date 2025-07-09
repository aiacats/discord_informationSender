const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('message-template-add')
        .setDescription('メッセージテンプレートを追加します')
        .addStringOption(option =>
            option
                .setName('name')
                .setDescription('テンプレート名')
                .setRequired(true)
                .setMaxLength(50)
        )
        .addStringOption(option =>
            option
                .setName('content')
                .setDescription('テンプレートの内容')
                .setRequired(true)
                .setMaxLength(2000)
        )
        .addStringOption(option =>
            option
                .setName('category')
                .setDescription('カテゴリー（任意）')
                .setRequired(false)
                .setMaxLength(30)
        ),
    
    async execute(interaction) {
        const templateName = interaction.options.getString('name');
        const content = interaction.options.getString('content');
        const category = interaction.options.getString('category') || '未分類';
        
        const templatesPath = path.join(__dirname, '../data/message-templates.json');
        let templates = {};
        
        // 既存のテンプレートを読み込み
        if (fs.existsSync(templatesPath)) {
            templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
        }
        
        // テンプレートIDを生成（既存のIDと重複しないように）
        const templateId = Date.now().toString();
        
        // 同じ名前のテンプレートが存在するかチェック
        const existingTemplate = Object.values(templates).find(t => t.name === templateName);
        if (existingTemplate) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('エラー')
                .setDescription(`「${templateName}」という名前のテンプレートは既に存在します。`)
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        
        // 新しいテンプレートを追加
        templates[templateId] = {
            id: templateId,
            name: templateName,
            content: content,
            category: category,
            createdAt: new Date().toISOString(),
            createdBy: interaction.user.id,
            createdByName: interaction.user.username,
            usageCount: 0
        };
        
        // ファイルに保存
        fs.writeFileSync(templatesPath, JSON.stringify(templates, null, 2));
        
        // 成功メッセージ
        const successEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('テンプレート追加完了')
            .setDescription(`メッセージテンプレート「${templateName}」を追加しました。`)
            .addFields(
                { name: 'テンプレート名', value: templateName, inline: true },
                { name: 'カテゴリー', value: category, inline: true },
                { name: 'ID', value: templateId, inline: true },
                { name: '文字数', value: `${content.length}文字`, inline: true }
            )
            .setFooter({ text: `作成者: ${interaction.user.username}` })
            .setTimestamp();
        
        // 内容のプレビュー（最初の200文字）
        const preview = content.length > 200 ? content.substring(0, 200) + '...' : content;
        successEmbed.addFields({ name: 'プレビュー', value: `\`\`\`${preview}\`\`\`` });
        
        await interaction.reply({ embeds: [successEmbed] });
    },
};