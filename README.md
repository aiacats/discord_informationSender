# Discord Information Sender Bot

Discordで情報を一括送信し、Google DriveとGoogle Calendarとの連携機能を提供するボットです。

## 機能概要

- **メッセージ一括送信**: 複数のチャンネルへの同時メッセージ送信
- **Google Drive連携**: プロジェクトフォルダの自動作成とテンプレート管理
- **Google Calendar連携**: 毎日定時にカレンダーの予定をDiscordに自動送信

## セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 設定ファイルの準備

`config/config-example.json`を`config.json`にコピーして編集：

```bash
cp config/config-example.json config.json
```

`config.json`を編集：
```json
{
  "clientId": "YOUR_BOT_CLIENT_ID",
  "guildId": "YOUR_DISCORD_SERVER_ID",
  "token": "YOUR_BOT_TOKEN"
}
```

### 3. Google API設定

- **Google Drive API**: `docs/GOOGLE_DRIVE_SETUP.md`を参照
- **Google Calendar API**: `docs/GOOGLE_CALENDAR_SETUP.md`を参照

### 4. コマンドの登録
```bash
# macOS/Linux
./scripts/deploy-commands.command

# または手動で
node deploy-commands.js
```

### 5. ボットの起動
```bash
# macOS/Linux
./scripts/start-bot.command

# または手動で
node index.js
```

## 使用可能なコマンド

### メッセージ送信関連
- `/vinfo_add-channel` - チャンネルを送信リストに追加
- `/vinfo_remove-channel` - チャンネルを送信リストから削除
- `/vinfo_send-message-to-list` - リストのチャンネルにメッセージ送信
- `/vinfo_send-message-to-category` - カテゴリ内の全チャンネルにメッセージ送信
- `/vinfo_view-channel-list` - 送信リストを表示

### Google Drive プロジェクト管理
- `/scan-folder` - Google Driveフォルダ構造をスキャンしてテンプレート作成
- `/create-project` - テンプレートを使用してプロジェクトフォルダを作成
- `/list-templates` - 利用可能なテンプレート一覧を表示

### Google Calendar 連携
- `/calendar-setup channel` - 通知チャンネルを設定
- `/calendar-setup calendar` - カレンダーIDを設定
- `/calendar-setup time` - 通知時刻を設定
- `/calendar-setup list` - 利用可能なカレンダー一覧を表示
- `/calendar-setup show` - 現在の設定を表示
- `/calendar-setup test` - テスト送信

## ファイル構成

```
discord_informationSender/
├── index.js                # メインエントリーポイント
├── deploy-commands.js      # コマンド登録スクリプト
├── commands/              # 各コマンドの実装
│   ├── calendar-setup.js
│   ├── create-project.js
│   ├── list-templates.js
│   ├── scan-folder.js
│   └── vInfo_*.js
├── self_module/           # ユーティリティモジュール
│   ├── ChannelList.js
│   ├── GoogleCalendarManager.js
│   └── GoogleDriveManager.js
├── config/                # 設定ファイル
│   ├── config-example.json
│   └── config.json (要作成)
├── data/                  # データファイル
│   └── templates.json
├── docs/                  # ドキュメント
│   ├── GOOGLE_CALENDAR_SETUP.md
│   └── GOOGLE_DRIVE_SETUP.md
└── scripts/               # 実行スクリプト
    ├── deploy-commands.command
    ├── start-bot.command
    └── stop-bot.command
```

## 注意事項

- `config.json`と`google-credentials.json`は機密情報のため、Gitにコミットしないでください
- カレンダー通知は日本時間（JST）で動作します
- Google Drive/Calendar APIを使用するには、適切な権限設定が必要です