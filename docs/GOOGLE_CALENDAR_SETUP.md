# Google Calendar API セットアップガイド

このガイドでは、Discord BotでGoogle Calendar APIを使用するための設定手順を説明します。

## 前提条件

既存の`google-credentials.json`（Google Drive API用）がある場合でも、Calendar APIのスコープを追加する必要があります。

## セットアップ手順

### 1. Google Cloud ConsoleでCalendar APIを有効化

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 既存のプロジェクト（Google Drive API用）を選択
3. 「APIとサービス」→「ライブラリ」を開く
4. 「Google Calendar API」を検索して選択
5. 「有効にする」ボタンをクリック

### 2. サービスアカウントの権限を更新

既存のサービスアカウントに Calendar API のスコープを追加：

1. 「IAMと管理」→「サービスアカウント」を開く
2. 既存のサービスアカウントを選択
3. 「キー」タブで新しいキーを作成（JSON形式）
4. ダウンロードしたファイルを`google-credentials.json`として保存

### 3. カレンダーへのアクセス権限を付与

Google Calendarでサービスアカウントに権限を付与：

1. Google Calendarを開く
2. 左側のメニューから対象のカレンダーの「⋮」をクリック
3. 「設定と共有」を選択
4. 「特定のユーザーとの共有」セクションで「ユーザーを追加」
5. サービスアカウントのメールアドレスを入力
   （例：`your-service-account@your-project.iam.gserviceaccount.com`）
6. 権限は「予定の表示（すべての詳細）」を選択
7. 「送信」をクリック

### 4. カレンダーIDの確認

1. Google Calendarの設定画面で「カレンダーの統合」を選択
2. 「カレンダーID」をコピー（通常はメールアドレス形式）

## Discord Botでの使用方法

### 初期設定

1. **通知チャンネルの設定**
   ```
   /calendar-setup channel #チャンネル名
   ```

2. **カレンダーIDの設定**
   ```
   /calendar-setup calendar your-calendar-id@gmail.com
   ```

3. **通知時刻の設定**（例：毎日9:00に通知）
   ```
   /calendar-setup time hour:9 minute:0
   ```

### 利用可能なコマンド

- `/calendar-setup list` - アクセス可能なカレンダー一覧を表示
- `/calendar-setup show` - 現在の設定を確認
- `/calendar-setup test` - テスト送信（今日の予定を送信）

### 動作確認

設定が完了したら、`/calendar-setup test`でテスト送信を行い、正しく動作することを確認してください。

## トラブルシューティング

### 「認証エラー」が表示される場合

- `google-credentials.json`が正しい場所にあるか確認
- ファイルの内容が正しいJSON形式か確認
- Calendar APIが有効になっているか確認

### 「アクセスエラー」が表示される場合

- カレンダーIDが正しいか確認
- サービスアカウントに適切な権限が付与されているか確認
- カレンダーの共有設定を再確認

### 予定が表示されない場合

- 終日予定として登録されているか確認（時間指定の予定は表示されません）
- カレンダーのタイムゾーンが正しく設定されているか確認

## 注意事項

- このBotは**終日予定のみ**を取得します
- 通知は日本時間（JST）で動作します
- 設定は`calendar-config.json`に保存されます（gitignoreに追加推奨）