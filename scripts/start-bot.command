#!/bin/bash

# プロジェクトのルートディレクトリに移動
cd "$(dirname "$0")/.."

# ターミナルのタイトルを設定
echo -e "\033]0;Discord Information Sender Bot\007"

# ボットの情報を表示
echo "=================================="
echo "Discord Information Sender Bot"
echo "=================================="
echo ""
echo "起動中..."
echo ""

# Node.jsがインストールされているか確認
if ! command -v node &> /dev/null; then
    echo "エラー: Node.jsがインストールされていません"
    echo "https://nodejs.org/ からインストールしてください"
    read -p "Enterキーを押して終了..."
    exit 1
fi

# package.jsonが存在するか確認
if [ ! -f "package.json" ]; then
    echo "エラー: package.jsonが見つかりません"
    read -p "Enterキーを押して終了..."
    exit 1
fi

# node_modulesが存在しない場合はインストール
if [ ! -d "node_modules" ]; then
    echo "依存関係をインストールしています..."
    npm install
    echo ""
fi

# config.jsonが存在するか確認
if [ ! -f "config.json" ]; then
    echo "エラー: config.jsonが見つかりません"
    echo "README.mdを参照して設定してください"
    read -p "Enterキーを押して終了..."
    exit 1
fi

# ボットを起動
echo "ボットを起動しています..."
echo "終了するには Ctrl+C を押してください"
echo ""
echo "=================================="
echo ""

# エラーが発生しても終了しないようにする
node index.js || {
    echo ""
    echo "エラーが発生しました"
    read -p "Enterキーを押して終了..."
}