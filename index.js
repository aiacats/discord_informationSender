const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');
const cron = require('node-cron');
const GoogleCalendarManager = require('./self_module/GoogleCalendarManager');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
console.log(commandsPath)
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// client => botの本体
// コマンドフォルダの中にあるコマンドを読み込む
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // commandsフォルダの中のファイル内に'command'と'execute'の文言があり使用できるファイルかどうか確認する
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// 入力されたコマンドを実行する
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

// ボットが起動した時に動作する処理
client.once(Events.ClientReady, async c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
    
    // カレンダースケジューラーの設定
    const calendarConfigPath = path.join(__dirname, 'calendar-config.json');
    
    if (fs.existsSync(calendarConfigPath)) {
        const config = JSON.parse(fs.readFileSync(calendarConfigPath, 'utf8'));
        
        if (config.channelId && config.calendarId && config.notificationTime) {
            // Google Calendar認証
            const authenticated = await GoogleCalendarManager.authenticate();
            
            if (authenticated) {
                // cronジョブの設定（毎日指定時刻に実行）
                const cronTime = `${config.notificationTime.minute} ${config.notificationTime.hour} * * *`;
                
                cron.schedule(cronTime, async () => {
                    try {
                        console.log('カレンダー通知を実行します...');
                        
                        const today = new Date();
                        const events = await GoogleCalendarManager.getTodayAllDayEvents(config.calendarId);
                        const message = GoogleCalendarManager.formatEventsForDiscord(events, today);
                        
                        const channel = await client.channels.fetch(config.channelId);
                        await channel.send(message);
                        
                        console.log('カレンダー通知を送信しました');
                    } catch (error) {
                        console.error('カレンダー通知エラー:', error);
                    }
                }, {
                    timezone: "Asia/Tokyo"
                });
                
                console.log(`カレンダー通知スケジューラーを設定しました: 毎日 ${config.notificationTime.hour}:${config.notificationTime.minute.toString().padStart(2, '0')}`);
            } else {
                console.error('Google Calendar APIの認証に失敗しました');
            }
        } else {
            console.log('カレンダー設定が不完全です。/calendar-setup コマンドで設定してください。');
        }
    } else {
        console.log('カレンダー設定ファイルが見つかりません。/calendar-setup コマンドで設定してください。');
    }
});

// Log in to Discord with your client's token
client.login(token);