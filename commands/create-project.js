const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const GoogleDriveManager = require('../self_module/GoogleDriveManager');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-project')
        .setDescription('Google Driveに指定したテンプレートでプロジェクトフォルダを作成します')
        .addStringOption(option =>
            option
                .setName('url')
                .setDescription('Google DriveフォルダのURL')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('project-name')
                .setDescription('プロジェクト名')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('template')
                .setDescription('使用するテンプレート（テンプレートIDを入力）')
                .setRequired(true)
        ),
    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            // Google Drive認証
            const authenticated = await GoogleDriveManager.authenticate();
            
            if (!authenticated) {
                const setupEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('認証エラー')
                    .setDescription('Google Drive APIの認証に失敗しました。')
                    .addFields(
                        { name: 'セットアップ手順', value: '以下の手順で設定してください：' },
                        { name: '1. Google Cloud Consoleでプロジェクト作成', value: '[Google Cloud Console](https://console.cloud.google.com/)にアクセス' },
                        { name: '2. Google Drive APIを有効化', value: 'APIライブラリからGoogle Drive APIを有効にする' },
                        { name: '3. サービスアカウントを作成', value: 'IAMと管理 > サービスアカウント から新規作成' },
                        { name: '4. 認証情報をダウンロード', value: 'JSON形式でダウンロードして`google-credentials.json`として保存' },
                        { name: '5. 共有設定', value: 'サービスアカウントのメールアドレスをGoogle Driveフォルダに共有' }
                    )
                    .setFooter({ text: '詳細はGoogle Drive API公式ドキュメントを参照' });
                
                await interaction.editReply({ embeds: [setupEmbed] });
                return;
            }

            // URLからフォルダIDを抽出
            const url = interaction.options.getString('url');
            const folderId = GoogleDriveManager.extractFolderIdFromUrl(url);
            
            if (!folderId) {
                await interaction.editReply('無効なGoogle DriveのURLです。正しいフォルダURLを入力してください。');
                return;
            }

            // アクセス権限チェック
            const hasAccess = await GoogleDriveManager.checkAccess(folderId);
            
            if (!hasAccess) {
                const accessEmbed = new EmbedBuilder()
                    .setColor(0xFFFF00)
                    .setTitle('アクセス権限エラー')
                    .setDescription('指定されたフォルダにアクセスできません。')
                    .addFields(
                        { name: '解決方法', value: '以下のメールアドレスにフォルダの編集権限を付与してください：' },
                        { name: 'サービスアカウント', value: '`[サービスアカウントのメールアドレス]`' },
                        { name: '共有手順', value: '1. Google Driveでフォルダを開く\n2. 共有ボタンをクリック\n3. メールアドレスを追加\n4. 編集者権限を選択\n5. 送信' }
                    );
                
                await interaction.editReply({ embeds: [accessEmbed] });
                return;
            }

            // 全テンプレート読み込み（標準・カスタム統合）
            const allTemplates = GoogleDriveManager.getAllTemplates();
            console.log('実行時テンプレート取得:', Object.keys(allTemplates).length, '個');
            
            const templateName = interaction.options.getString('template');
            const projectName = interaction.options.getString('project-name');
            console.log('選択されたテンプレート:', templateName);
            
            if (!allTemplates[templateName]) {
                console.log('利用可能なテンプレート:', Object.keys(allTemplates));
                
                // 利用可能なテンプレートを表示
                const availableTemplates = Object.entries(allTemplates)
                    .map(([key, template]) => {
                        const createdDate = template.createdAt ? ` - 作成日: ${new Date(template.createdAt).toLocaleDateString('ja-JP')}` : '';
                        return `\`${key}\` - ${template.name}${createdDate}`;
                    });
                
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('テンプレートが見つかりません')
                    .setDescription(`指定されたテンプレート「${templateName}」が見つかりません。`)
                    .setTimestamp();
                
                if (availableTemplates.length > 0) {
                    errorEmbed.addFields({
                        name: '📋 利用可能なテンプレート',
                        value: availableTemplates.join('\n')
                    });
                    errorEmbed.setFooter({
                        text: 'テンプレートIDをコピーして、もう一度お試しください'
                    });
                } else {
                    errorEmbed.addFields({
                        name: 'テンプレートがありません',
                        value: '/scan-folder コマンドでテンプレートを作成してください'
                    });
                }
                
                await interaction.editReply({ embeds: [errorEmbed] });
                return;
            }

            const selectedTemplate = allTemplates[templateName];

            // プロジェクト作成
            const statusEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('プロジェクト作成中...')
                .setDescription(`📋 テンプレート「${selectedTemplate.name}」でプロジェクトを作成しています...`);
            
            await interaction.editReply({ embeds: [statusEmbed] });

            const projectFolder = await GoogleDriveManager.createProjectStructure(
                folderId,
                projectName,
                selectedTemplate.structure
            );

            // 完了通知
            const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('プロジェクト作成完了！')
                .setDescription(`プロジェクト「${projectName}」が正常に作成されました。`)
                .addFields(
                    { name: 'プロジェクト名', value: projectName },
                    { name: 'テンプレート', value: `📋 ${selectedTemplate.name}` },
                    { name: 'フォルダID', value: projectFolder.id },
                    { name: 'アクセス', value: `[Google Driveで開く](https://drive.google.com/drive/folders/${projectFolder.id})` }
                );

            if (selectedTemplate.createdAt) {
                successEmbed.addFields({
                    name: 'テンプレート作成日',
                    value: new Date(selectedTemplate.createdAt).toLocaleString('ja-JP')
                });
            }

            successEmbed.setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('プロジェクト作成エラー:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('エラーが発生しました')
                .setDescription(`プロジェクトの作成中にエラーが発生しました。\n\`\`\`${error.message}\`\`\``)
                .setTimestamp();
            
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};