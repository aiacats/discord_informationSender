const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleCalendarManager {
    constructor() {
        this.calendar = null;
        this.auth = null;
    }

    async authenticate() {
        try {
            const credentialsPath = path.join(__dirname, '../google-credentials.json');
            
            if (!fs.existsSync(credentialsPath)) {
                throw new Error('Google認証情報ファイル (google-credentials.json) が見つかりません。');
            }

            const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
            
            this.auth = new google.auth.GoogleAuth({
                credentials: credentials,
                scopes: [
                    'https://www.googleapis.com/auth/calendar.readonly'
                ]
            });

            this.calendar = google.calendar({ version: 'v3', auth: this.auth });
            
            return true;
        } catch (error) {
            console.error('Google Calendar認証エラー:', error);
            return false;
        }
    }

    async getTodayAllDayEvents(calendarId) {
        try {
            // 今日の日付を取得（日本時間）
            const now = new Date();
            const today = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
            today.setHours(0, 0, 0, 0);
            
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const response = await this.calendar.events.list({
                calendarId: calendarId,
                timeMin: today.toISOString(),
                timeMax: tomorrow.toISOString(),
                singleEvents: true,
                orderBy: 'startTime',
                timeZone: 'Asia/Tokyo'
            });

            const events = response.data.items || [];
            
            // 終日イベントのみフィルタリング
            const allDayEvents = events.filter(event => {
                return event.start.date && !event.start.dateTime;
            });

            return allDayEvents;
        } catch (error) {
            console.error('イベント取得エラー:', error);
            throw error;
        }
    }

    formatEventsForDiscord(events, date) {
        if (events.length === 0) {
            return {
                content: null,
                embeds: [{
                    color: 0x9B59B6,
                    title: `📅 ${date.toLocaleDateString('ja-JP')}の予定`,
                    description: '今日の終日予定はありません',
                    timestamp: new Date()
                }]
            };
        }

        const eventList = events.map(event => {
            const title = event.summary || '（タイトルなし）';
            const description = event.description ? `\n　└ ${event.description}` : '';
            return `• **${title}**${description}`;
        }).join('\n\n');

        return {
            content: null,
            embeds: [{
                color: 0x3498DB,
                title: `📅 ${date.toLocaleDateString('ja-JP')}の予定`,
                description: eventList,
                footer: {
                    text: `全${events.length}件の終日予定`
                },
                timestamp: new Date()
            }]
        };
    }

    async checkCalendarAccess(calendarId) {
        try {
            const response = await this.calendar.calendarList.get({
                calendarId: calendarId
            });
            return true;
        } catch (error) {
            if (error.code === 404) {
                return false;
            }
            throw error;
        }
    }

    async getCalendarList() {
        try {
            const response = await this.calendar.calendarList.list({
                maxResults: 50
            });
            
            return response.data.items || [];
        } catch (error) {
            console.error('カレンダーリスト取得エラー:', error);
            throw error;
        }
    }
}

module.exports = new GoogleCalendarManager();