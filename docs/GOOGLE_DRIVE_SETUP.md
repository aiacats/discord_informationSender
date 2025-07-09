# Google Drive API セットアップガイド

`/create-project` コマンドを使用するには、Google Drive APIの設定が必要です。

## セットアップ手順

### 1. Google Cloud Consoleでプロジェクトを作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成
3. プロジェクト名を設定（例：`discord-bot-drive`）

### 2. Google Drive APIを有効化

1. 左メニューから「APIとサービス」→「ライブラリ」を選択
2. 「Google Drive API」を検索
3. 「有効にする」をクリック

### 3. サービスアカウントを作成

1. 左メニューから「IAMと管理」→「サービスアカウント」を選択
2. 「サービスアカウントを作成」をクリック
3. サービスアカウント名を入力（例：`discord-bot-service`）
4. 「作成して続行」をクリック
5. ロールは設定せずに「続行」
6. 「完了」をクリック

### 4. 認証キーの作成とダウンロード

1. 作成したサービスアカウントをクリック
2. 「キー」タブを選択
3. 「鍵を追加」→「新しい鍵を作成」
4. 「JSON」を選択して「作成」
5. ダウンロードされたJSONファイルを`google-credentials.json`という名前でプロジェクトのルートディレクトリに保存

### 5. Google Driveフォルダへのアクセス権限設定

1. Google Driveで対象のフォルダを開く
2. 右クリックして「共有」を選択
3. サービスアカウントのメールアドレスを追加
   - メールアドレスは`google-credentials.json`内の`client_email`フィールドに記載
   - 例：`discord-bot-service@project-name.iam.gserviceaccount.com`
4. 「編集者」権限を選択
5. 「送信」をクリック

## 使用方法

```
/create-project url:https://drive.google.com/drive/folders/xxxxx project-name:新規プロジェクト template:web-project
```

### パラメータ

- `url`: Google DriveフォルダのURL
- `project-name`: 作成するプロジェクトフォルダ名
- `template`: 使用するテンプレート
  - `web-project`: Webプロジェクト用
  - `simple-project`: シンプルなプロジェクト用
  - `software-project`: ソフトウェア開発プロジェクト用

## トラブルシューティング

### 認証エラーが発生する場合

1. `google-credentials.json`が正しい場所に配置されているか確認
2. ファイルの内容が正しいJSON形式か確認
3. サービスアカウントが有効になっているか確認

### アクセス権限エラーが発生する場合

1. サービスアカウントのメールアドレスが正しく共有されているか確認
2. 編集者権限が付与されているか確認
3. 親フォルダにもアクセス権限があるか確認

## セキュリティ注意事項

- `google-credentials.json`は機密情報です。GitHubなどに公開しないでください
- `.gitignore`に必ず追加してください
- 本番環境では環境変数での管理を推奨します