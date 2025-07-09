const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('message-template-list')
        .setDescription('保存されているメッセージテンプレートの一覧を表示します')
        .addStringOption(option =>
            option
                .setName('category')
                .setDescription('カテゴリーで絞り込み（任意）')
                .setRequired(false)
        ),
    
    async execute(interaction) {
        const filterCategory = interaction.options.getString('category');
        const templatesPath = path.join(__dirname, '../data/message-templates.json');
        
        // テンプレートファイルが存在しない場合
        if (!fs.existsSync(templatesPath)) {
            const emptyEmbed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle('メッセージテンプレート一覧')
                .setDescription('まだテンプレートが登録されていません。\n`/message-template-add`でテンプレートを追加してください。')
                .setTimestamp();
            
            await interaction.reply({ embeds: [emptyEmbed] });
            return;
        }
        
        // テンプレートを読み込み
        const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
        
        // フィルタリング
        let templateList = Object.values(templates);
        if (filterCategory) {
            templateList = templateList.filter(t => t.category === filterCategory);
        }
        
        // テンプレートが存在しない場合
        if (templateList.length === 0) {
            const emptyEmbed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle('メッセージテンプレート一覧')
                .setDescription(filterCategory 
                    ? `カテゴリー「${filterCategory}」のテンプレートは見つかりませんでした。`
                    : 'まだテンプレートが登録されていません。')
                .setTimestamp();
            
            await interaction.reply({ embeds: [emptyEmbed] });
            return;
        }
        
        // カテゴリー別にグループ化
        const categorizedTemplates = {};
        templateList.forEach(template => {
            if (!categorizedTemplates[template.category]) {
                categorizedTemplates[template.category] = [];
            }
            categorizedTemplates[template.category].push(template);
        });
        
        // Embedを作成
        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('メッセージテンプレート一覧')
            .setDescription(filterCategory 
                ? `カテゴリー「${filterCategory}」のテンプレート`
                : `全${templateList.length}件のテンプレート`)
            .setTimestamp();
        
        // カテゴリーごとにフィールドを追加
        for (const [category, templates] of Object.entries(categorizedTemplates)) {
            let fieldValue = '';
            
            templates.forEach(template => {
                const createdDate = new Date(template.createdAt).toLocaleDateString('ja-JP');
                const preview = template.content.length > 50 
                    ? template.content.substring(0, 50) + '...' 
                    : template.content;
                
                fieldValue += `**${template.name}** (ID: \`${template.id}\`)\n`;
                fieldValue += `└ ${preview}\n`;
                fieldValue += `└ 作成: ${createdDate} | 使用回数: ${template.usageCount}回\n\n`;
            });
            
            // フィールドの文字数制限（1024文字）を考慮
            if (fieldValue.length > 1024) {
                fieldValue = fieldValue.substring(0, 1021) + '...';
            }
            
            embed.addFields({
                name: `📁 ${category}`,
                value: fieldValue || '（テンプレートなし）'
            });
        }
        
        // 使用方法の説明
        embed.setFooter({ 
            text: 'テンプレートを使用するには /message-template-use を使用してください' 
        });
        
        await interaction.reply({ embeds: [embed] });
    },
};