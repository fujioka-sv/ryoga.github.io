# KakeiLog — CLAUDE.md

## 概要
個人用ミニマル家計簿アプリ。3秒で支出を記録することを最優先とする。

## ディレクトリ構成
```
src/
  db/           # Dexie スキーマ・シード
  types/        # TypeScript 型定義
  hooks/        # useLiveQuery ベースのカスタムフック
  components/
    layout/     # BottomNav, Header
    ui/         # 再利用可能な表示コンポーネント
  pages/        # 各画面（Home, Input, List, Report, Categories, Settings）
  utils/        # CSV エクスポート・インポート
```

## コミットメッセージ規約
```
<type>: <subject>

type: feat | fix | refactor | style | chore | docs
例: feat: カテゴリ並び替え機能を追加
```

## 命名規則
- コンポーネント: PascalCase
- フック: camelCase (use プレフィックス)
- ユーティリティ: camelCase
- 型: PascalCase (interface / type)
- ファイル: コンポーネントは PascalCase.tsx、それ以外は camelCase.ts

## 技術スタック
- React 18 + TypeScript + Vite 4
- Tailwind CSS 3（アクセントカラー: Indigo-500 = #6366f1）
- Dexie.js（IndexedDB ORM）
- Chart.js + react-chartjs-2
- papaparse（CSV）

## データモデル
- `transactions`: id, date(YYYY-MM-DD), amount(整数), type, categoryId, paymentMethod, memo, createdAt, updatedAt
- `categories`: id, name, type, order

## 開発コマンド
```bash
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド
npm run preview  # ビルド結果のプレビュー
```

## デプロイ (GitHub Pages)
1. `vite.config.ts` の `base` をリポジトリ名に設定 (`/kakeilog/`)
2. `npm run build`
3. `npx gh-pages -d dist`

## スコープ外（やらないこと）
- 複数ユーザー対応
- 多通貨対応
- 銀行・クレカ API 連携
