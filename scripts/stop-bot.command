#!/bin/bash

# プロジェクトのルートディレクトリに移動
cd "$(dirname "$0")/.."

echo "=================================="
echo "Discord Bot 停止スクリプト"
echo "=================================="
echo ""

# node index.jsのプロセスを検索
PIDS=$(ps aux | grep "node index.js" | grep -v grep | awk '{print $2}')

if [ -z "$PIDS" ]; then
    echo "ボットは起動していません"
else
    echo "実行中のボットを停止しています..."
    for PID in $PIDS; do
        kill $PID
        echo "プロセス $PID を停止しました"
    done
    echo ""
    echo "ボットを停止しました"
fi

echo ""
read -p "Enterキーを押して終了..."