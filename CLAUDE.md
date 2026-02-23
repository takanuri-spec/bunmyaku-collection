# 文脈コレクション — Claude開発ガイド

## プロジェクト概要

営業・企画担当者が案件の「文脈（コンテクスト）」を管理するローカルWebツール。
テキスト（議事録・資料など）をAIで解析し、**顧客・営業・業務**の3種のカードとして整理・蓄積する。

**主な機能:**
- AI抽出（汎用：3カード同時 / 専門：1領域を網羅1枚）
- カードの手動編集・AI精錬
- 案件（ケース）へのカード紐付け
- 案件コンテクストの統合Export（Markdown / JSON）＋ログ保存

---

## 開発起動

```bash
npm run dev        # 日本語版（ポート5173 + 3001）
npm run dev:en     # 英語版（ポート5173 + 3002）
```

**サーバーは2プロセス構成:**
- `vite`（フロント dev server、5173）
- `node server/index.cjs`（Express + json-server、3001）

APIキーは `.env.local` に記載（gitに含めない）:
```
GOOGLE_API_KEY=AIza...
```

---

## ディレクトリ構成

```
src/
  types/index.ts          # 型定義（CardType, ContextCard, ContextCase, ExportLog など）
  config.ts               # LANG / LOCALE などビルド時設定
  i18n/index.ts           # 日英ラベル辞書（t()関数）
  store/useStore.ts       # Zustand グローバルストア（cards, cases）
  services/
    api.ts                # json-server REST呼び出し（cardsApi, casesApi, exportsApi）
    claude.ts             # Gemini API呼び出し（抽出・精錬・統合）
    promptSettings.ts     # プロンプトテンプレート管理
  components/
    layout/               # Sidebar, Header
    cards/                # ContextCard, CardEditor, CardTypeTag
    extraction/           # InputArea, DraftCard
    export/               # ExportPanel
  pages/                  # Dashboard, ExtractionPage, CardDetailPage, CasesPage, SettingsPage
server/
  index.cjs               # Express（Geminiプロキシ + json-server）
db.json                   # ローカルDB（cards / cases / exports）
```

---

## アーキテクチャの急所（変更時は必ず確認）

### 1. サーバーのルート順序
`server/index.cjs` で `/gemini` ルートは必ず `app.use('/api', ...)` より**前**に登録する。
後ろに置くと json-server が横取りして 404 になる。

```js
// ✅ 正しい順序
app.post('/gemini', express.json({limit:'10mb'}), handler);  // 先
app.use('/api', middlewares, router);                         // 後
```

### 2. express.json() はグローバルに使わない
`express.json()` をグローバルに `app.use()` すると、json-server 自身のボディパーサーと競合し POST /api/* が 500 になる。
`/gemini` ルートのミドルウェアとしてのみ適用すること。

```js
// ✅ ルートレベルだけに適用
app.post('/gemini', express.json({ limit: '10mb' }), handler);

// ❌ グローバルに使わない
// app.use(express.json());
```

### 3. IDの型変換（json-server は数値ID、URLは文字列）
json-server が払い出すIDは **数値型**（例: `id: 2`）。
React Router のパラメータや比較は常に `String()` で揃える。

```ts
// ✅
cards.find((c) => String(c.id) === String(id))

// ❌ 厳密等価は必ず false になる
cards.find((c) => c.id === id)
```

### 4. db.json にコレクションがないと json-server は 404
新しいエンドポイントを追加したら `db.json` に空配列を追加する。

```json
{
  "cards": [],
  "cases": [],
  "exports": []   ← 忘れると POST /api/exports が 404
}
```

---

## データモデル

```ts
type CardType = 'customer' | 'sales' | 'operations';

interface ContextCard {
  id: string | number;   // json-serverは数値で保存
  type: CardType;
  title: string;
  content: string;       // Markdown可
  tags: string[];
  sourceText?: string;   // 抽出元テキスト
  createdAt: string;     // ISO 8601
  updatedAt: string;
}

interface ContextCase {
  id: string | number;
  name: string;
  description: string;
  cardIds: string[];     // カードIDを文字列で保持
  createdAt: string;
  updatedAt: string;
}

interface ExportLog {
  id: string | number;
  caseId: string | number;
  caseName: string;
  mergedContent: string;
  sourceCardIds: (string | number)[];
  createdAt: string;
}
```

---

## AIサービス（src/services/claude.ts）

Geminiへのリクエストはすべて `/gemini` プロキシ経由（APIキーをフロントに露出しない）。

| 関数 | 用途 |
|------|------|
| `extractContexts(text, focusHint?)` | 汎用抽出 → 3カード |
| `extractSpecialized(type, focusHint, text)` | 専門抽出 → 1カード（網羅・仔細） |
| `refineCard(type, content, instruction)` | カード内容をAI精錬 |
| `mergeContexts(caseName, cards)` | 複数カードを統合Markdown生成 |

プロンプトは `promptSettings.ts` で管理。設定画面（SettingsPage）から編集可能。

---

## スタイル・UI規則

- **Tailwind CSS v3** のみ使用（コンポーネントライブラリ不使用）
- カード色: 顧客=青（blue）/ 営業=緑（green）/ 業務=琥珀（amber）
- `CARD_TYPE_COLORS` を参照してバッジ・ボーダー色を統一する
- 日英切り替えは `t('キー')` 関数（`src/i18n/index.ts`）経由

---

## よくある作業パターン

**新しいページを追加する:**
1. `src/pages/XxxPage.tsx` を作成
2. `src/App.tsx` にルートを追加
3. `src/components/layout/Sidebar.tsx` にNavLinkを追加

**新しいAPIコレクションを追加する:**
1. `src/types/index.ts` にインターフェース追加
2. `src/services/api.ts` にCRUD関数追加
3. `db.json` に空配列を追加（**必須**。忘れると404）

**新しいAI機能を追加する:**
1. `src/services/claude.ts` に関数追加
2. 必要なら `promptSettings.ts` にテンプレートを外出し
3. コンポーネントから呼び出し（ローディング・エラー状態を必ず管理）

---

## 開発の進め方（オーナーへ）

このプロジェクトはノーコード寄りのアプローチで進めています。

- **機能要望は日本語で気軽に伝えてください**。「○○したい」「△△がおかしい」で十分です。
- エラーが出たときは画面のメッセージ（ステータスコードなど）も伝えると診断が早いです。
- 大きな変更の前には「どう変えるか」を確認してから実装します。
- ローカルツールなので、壊れても `db.json` と `.env.local` さえあれば復元できます。
