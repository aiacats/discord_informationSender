const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('message-template-use')
        .setDescription('保存されたテンプレートを使用してメッセージを送信します')
        .addStringOption(option =>
            option
                .setName('template')
                .setDescription('使用するテンプレート名またはID')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('送信先チャンネル（省略時は現在のチャンネル）')
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('variables')
                .setDescription('変数の置換（例: {name}=太郎,{date}=2024/01/01）')
                .setRequired(false)
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
        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
        const variablesInput = interaction.options.getString('variables');
        
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
        let template = templates[templateInput];
        if (!template) {
            template = Object.values(templates).find(t => t.name === templateInput);
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
        
        // メッセージ内容を準備
        let messageContent = template.content;
        
        // 変数の置換処理
        if (variablesInput) {
            const variables = {};
            
            // 変数をパース（例: {name}=太郎,{date}=2024/01/01）
            variablesInput.split(',').forEach(pair => {
                const [key, value] = pair.split('=');
                if (key && value) {
                    variables[key.trim()] = value.trim();
                }
            });
            
            // テンプレート内の変数を置換
            for (const [key, value] of Object.entries(variables)) {
                messageContent = messageContent.replace(new RegExp(key, 'g'), value);
            }
        }
        
        // 送信権限の確認
        if (!targetChannel.permissionsFor(interaction.guild.members.me).has('SendMessages')) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('権限エラー')
                .setDescription(`${targetChannel}にメッセージを送信する権限がありません。`)
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        
        try {
            // メッセージを送信
            await targetChannel.send(messageContent);
            
            // 使用回数を更新
            template.usageCount = (template.usageCount || 0) + 1;
            template.lastUsedAt = new Date().toISOString();
            template.lastUsedBy = interaction.user.id;
            
            // 更新したデータを保存
            fs.writeFileSync(templatesPath, JSON.stringify(templates, null, 2));
            
            // 成功メッセージ
            const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('送信完了')
                .setDescription(`テンプレート「${template.name}」を使用してメッセージを送信しました。`)
                .addFields(
                    { name: '送信先', value: `${targetChannel}`, inline: true },
                    { name: '使用回数', value: `${template.usageCount}回`, inline: true }
                )
                .setTimestamp();
            
            // 変数置換の情報を追加
            if (variablesInput) {
                successEmbed.addFields({
                    name: '置換された変数',
                    value: variablesInput
                });
            }
            
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
            
        } catch (error) {
            console.error('メッセージ送信エラー:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('送信エラー')
                .setDescription('メッセージの送信中にエラーが発生しました。')
                .addFields({
                    name: 'エラー詳細',
                    value: `\`\`\`${error.message}\`\`\``
                })
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};