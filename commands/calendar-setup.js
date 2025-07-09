const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const GoogleCalendarManager = require('../self_module/GoogleCalendarManager');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calendar-setup')
        .setDescription('Google Calendarの設定を行います')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('channel')
                .setDescription('カレンダー通知を送信するチャンネルを設定します')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('通知を送信するチャンネル')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('calendar')
                .setDescription('使用するGoogle CalendarのIDを設定します')
                .addStringOption(option =>
                    option
                        .setName('calendar-id')
                        .setDescription('Google CalendarのID（メールアドレス形式）')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('time')
                .setDescription('通知時刻を設定します')
                .addIntegerOption(option =>
                    option
                        .setName('hour')
                        .setDescription('時（0-23）')
                        .setRequired(true)
                        .setMinValue(0)
                        .setMaxValue(23)
                )
                .addIntegerOption(option =>
                    option
                        .setName('minute')
                        .setDescription('分（0-59）')
                        .setRequired(true)
                        .setMinValue(0)
                        .setMaxValue(59)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('利用可能なカレンダー一覧を表示します')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('現在の設定を表示します')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('設定をテストします（今日の予定を送信）')
        ),
    
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        const configPath = path.join(__dirname, '../calendar-config.json');

        // 設定ファイルを読み込み
        let config = {};
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }

        // Google Calendar認証
        const authenticated = await GoogleCalendarManager.authenticate();
        if (!authenticated && subcommand !== 'show') {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('認証エラー')
                .setDescription('Google Calendar APIの認証に失敗しました。\n`google-credentials.json`ファイルを確認してください。')
                .addFields({
                    name: '必要なスコープ',
                    value: '`https://www.googleapis.com/auth/calendar.readonly`'
                });
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }

        switch (subcommand) {
            case 'channel':
                const channel = interaction.options.getChannel('channel');
                config.channelId = channel.id;
                config.guildId = interaction.guild.id;
                
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                
                const channelEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('チャンネル設定完了')
                    .setDescription(`カレンダー通知を ${channel} に送信します。`);
                
                await interaction.reply({ embeds: [channelEmbed] });
                break;

            case 'calendar':
                const calendarId = interaction.options.getString('calendar-id');
                
                // カレンダーへのアクセス確認
                try {
                    const hasAccess = await GoogleCalendarManager.checkCalendarAccess(calendarId);
                    if (!hasAccess) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setTitle('アクセスエラー')
                            .setDescription('指定されたカレンダーにアクセスできません。')
                            .addFields({
                                name: '解決方法',
                                value: '1. カレンダーIDが正しいか確認\n2. サービスアカウントにカレンダーの閲覧権限を付与'
                            });
                        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                        return;
                    }
                    
                    config.calendarId = calendarId;
                    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                    
                    const calendarEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('カレンダー設定完了')
                        .setDescription(`カレンダーID: \`${calendarId}\` を使用します。`);
                    
                    await interaction.reply({ embeds: [calendarEmbed] });
                } catch (error) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('エラー')
                        .setDescription(`カレンダーの確認中にエラーが発生しました。\n\`\`\`${error.message}\`\`\``);
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
                break;

            case 'time':
                const hour = interaction.options.getInteger('hour');
                const minute = interaction.options.getInteger('minute');
                
                config.notificationTime = {
                    hour: hour,
                    minute: minute
                };
                
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                
                const timeEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('通知時刻設定完了')
                    .setDescription(`毎日 ${hour}:${minute.toString().padStart(2, '0')} に通知します。`);
                
                await interaction.reply({ embeds: [timeEmbed] });
                break;

            case 'list':
                await interaction.deferReply();
                
                try {
                    const calendars = await GoogleCalendarManager.getCalendarList();
                    
                    if (calendars.length === 0) {
                        await interaction.editReply('利用可能なカレンダーがありません。');
                        return;
                    }
                    
                    const calendarList = calendars.map(cal => {
                        const primary = cal.primary ? ' (プライマリ)' : '';
                        return `• **${cal.summary}**${primary}\n  ID: \`${cal.id}\``;
                    }).join('\n\n');
                    
                    const listEmbed = new EmbedBuilder()
                        .setColor(0x3498DB)
                        .setTitle('利用可能なカレンダー')
                        .setDescription(calendarList)
                        .setFooter({ text: 'カレンダーIDをコピーして /calendar-setup calendar で設定してください' });
                    
                    await interaction.editReply({ embeds: [listEmbed] });
                } catch (error) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('エラー')
                        .setDescription(`カレンダー一覧の取得中にエラーが発生しました。\n\`\`\`${error.message}\`\`\``);
                    await interaction.editReply({ embeds: [errorEmbed] });
                }
                break;

            case 'show':
                const showEmbed = new EmbedBuilder()
                    .setColor(0x3498DB)
                    .setTitle('現在の設定')
                    .setTimestamp();
                
                if (config.channelId) {
                    showEmbed.addFields({
                        name: '通知チャンネル',
                        value: `<#${config.channelId}>`,
                        inline: true
                    });
                } else {
                    showEmbed.addFields({
                        name: '通知チャンネル',
                        value: '未設定',
                        inline: true
                    });
                }
                
                if (config.calendarId) {
                    showEmbed.addFields({
                        name: 'カレンダーID',
                        value: `\`${config.calendarId}\``,
                        inline: true
                    });
                } else {
                    showEmbed.addFields({
                        name: 'カレンダーID',
                        value: '未設定',
                        inline: true
                    });
                }
                
                if (config.notificationTime) {
                    showEmbed.addFields({
                        name: '通知時刻',
                        value: `${config.notificationTime.hour}:${config.notificationTime.minute.toString().padStart(2, '0')}`,
                        inline: true
                    });
                } else {
                    showEmbed.addFields({
                        name: '通知時刻',
                        value: '未設定',
                        inline: true
                    });
                }
                
                await interaction.reply({ embeds: [showEmbed] });
                break;

            case 'test':
                if (!config.channelId || !config.calendarId) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('設定エラー')
                        .setDescription('チャンネルとカレンダーIDを設定してください。');
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                    return;
                }
                
                await interaction.deferReply();
                
                try {
                    const today = new Date();
                    const events = await GoogleCalendarManager.getTodayAllDayEvents(config.calendarId);
                    const message = GoogleCalendarManager.formatEventsForDiscord(events, today);
                    
                    const channel = await client.channels.fetch(config.channelId);
                    await channel.send(message);
                    
                    const successEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('テスト送信完了')
                        .setDescription(`${channel} に今日の予定を送信しました。`);
                    
                    await interaction.editReply({ embeds: [successEmbed] });
                } catch (error) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('エラー')
                        .setDescription(`テスト送信中にエラーが発生しました。\n\`\`\`${error.message}\`\`\``);
                    await interaction.editReply({ embeds: [errorEmbed] });
                }
                break;
        }
    },
};