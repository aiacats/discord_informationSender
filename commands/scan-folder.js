const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const GoogleDriveManager = require('../self_module/GoogleDriveManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('scan-folder')
        .setDescription('Google Driveフォルダの構造をスキャンしてテンプレートとして保存します')
        .addStringOption(option =>
            option
                .setName('url')
                .setDescription('スキャンするGoogle DriveフォルダのURL')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('template-name')
                .setDescription('保存するテンプレート名')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('depth')
                .setDescription('スキャンする階層の深さ（デフォルト: 5）')
                .setMinValue(1)
                .setMaxValue(10)
                .setRequired(false)
        ),
    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            // Google Drive認証
            const authenticated = await GoogleDriveManager.authenticate();
            
            if (!authenticated) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('認証エラー')
                    .setDescription('Google Drive APIの認証に失敗しました。`GOOGLE_DRIVE_SETUP.md`を参照してください。');
                
                await interaction.editReply({ embeds: [errorEmbed] });
                return;
            }

            // URLからフォルダIDを抽出
            const url = interaction.options.getString('url');
            const folderId = GoogleDriveManager.extractFolderIdFromUrl(url);
            
            if (!folderId) {
                await interaction.editReply('無効なGoogle DriveのURLです。');
                return;
            }

            // アクセス権限チェック
            const hasAccess = await GoogleDriveManager.checkAccess(folderId);
            
            if (!hasAccess) {
                const accessEmbed = new EmbedBuilder()
                    .setColor(0xFFFF00)
                    .setTitle('アクセス権限エラー')
                    .setDescription('指定されたフォルダにアクセスできません。サービスアカウントに権限を付与してください。');
                
                await interaction.editReply({ embeds: [accessEmbed] });
                return;
            }

            // スキャン開始
            const statusEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('フォルダ構造をスキャン中...')
                .setDescription('フォルダの階層構造を読み取っています...');
            
            await interaction.editReply({ embeds: [statusEmbed] });

            // フォルダ構造をスキャン
            const depth = interaction.options.getInteger('depth') || 5;
            const structure = await GoogleDriveManager.scanFolderStructure(folderId, depth);
            
            // テンプレートとして保存
            const templateName = interaction.options.getString('template-name');
            const saved = await GoogleDriveManager.saveCustomTemplate(templateName, structure);

            if (!saved) {
                await interaction.editReply('テンプレートの保存に失敗しました。');
                return;
            }

            // 構造をプレビュー表示
            function buildStructurePreview(items, indent = '') {
                let preview = '';
                for (const item of items) {
                    preview += `${indent}📁 ${item.name}\n`;
                    if (item.children && item.children.length > 0) {
                        preview += buildStructurePreview(item.children, indent + '  ');
                    }
                }
                return preview;
            }

            const structurePreview = buildStructurePreview(structure.children || []);
            const previewText = structurePreview.length > 1000 
                ? structurePreview.substring(0, 1000) + '...\n(省略)'
                : structurePreview;

            // 完了通知
            const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('スキャン完了！')
                .setDescription(`フォルダ構造をテンプレート「${templateName}」として保存しました。`)
                .addFields(
                    { name: 'ルートフォルダ', value: structure.name },
                    { name: 'スキャンした階層', value: `${depth}階層` },
                    { name: 'フォルダ構造', value: `\`\`\`\n${previewText}\`\`\`` }
                )
                .setFooter({ text: `/create-projectコマンドでこのテンプレートを使用できます` })
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('フォルダスキャンエラー:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('エラーが発生しました')
                .setDescription(`フォルダのスキャン中にエラーが発生しました。\n\`\`\`${error.message}\`\`\``)
                .setTimestamp();
            
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};