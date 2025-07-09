#!/bin/bash

# プロジェクトのルートディレクトリに移動
cd "$(dirname "$0")/.."

echo "=================================="
echo "Discord コマンド登録スクリプト"
echo "=================================="
echo ""

# Node.jsがインストールされているか確認
if ! command -v node &> /dev/null; then
    echo "エラー: Node.jsがインストールされていません"
    echo "https://nodejs.org/ からインストールしてください"
    read -p "Enterキーを押して終了..."
    exit 1
fi

# config.jsonが存在するか確認
if [ ! -f "config.json" ]; then
    echo "エラー: config.jsonが見つかりません"
    echo "README.mdを参照して設定してください"
    read -p "Enterキーを押して終了..."
    exit 1
fi

# node_modulesが存在しない場合はインストール
if [ ! -d "node_modules" ]; then
    echo "依存関係をインストールしています..."
    npm install
    echo ""
fi

echo "コマンドを登録しています..."
echo ""

# コマンドを登録
node deploy-commands.js

echo ""
echo "=================================="
echo ""
read -p "Enterキーを押して終了..."