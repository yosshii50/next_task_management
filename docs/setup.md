# セットアップ手順

## 前提
- Node.js 18 以降
- PostgreSQL（`.env` の `DATABASE2_POSTGRES_URL` / `DATABASE2_PRISMA_DATABASE_URL` を利用）

## 環境変数
`.env.example` をコピーして `.env` を作成し、以下を最低限設定します。

- `DATABASE2_POSTGRES_URL` / `DATABASE2_PRISMA_DATABASE_URL` : 接続文字列（`DATABASE2_DATABASE_URL` は未使用）
- `NEXTAUTH_SECRET` : ランダムな長文字列
- `NEXTAUTH_URL` : ローカルは `http://localhost:3001`（ポート 3000 のままだと認証が失敗します）
- `APP_BASE_URL` : `http://localhost:3001`
- SMTP を使う場合のみ `SMTP_*` / `MAIL_FROM` を設定

## 依存関係のインストール
```bash
npm install
```
`postinstall` で `prisma generate` が自動実行されます。

## データベース初期化
```bash
npx prisma migrate dev --name init
```
DB が空の場合はこの1本でスキーマと Prisma Client が揃います。

## ユーザー作成（必須）
1. ハッシュ化パスワードを生成  
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
   ```
2. `npx prisma studio` を開き `User` レコードを追加  
   - `email`, `hashedPassword` を入力  
   - 管理者にする場合は `isAdmin` を `true`

## 開発サーバー
```bash
npm run dev   # http://localhost:3001
```
本番相当で起動する場合は `npm run build` → `npm start`（同じくポート 3001）。

## その他コマンド
- Lint: `npm run lint`
- TypeScript ウォッチ: `npm run typecheck`
- Prisma Studio: `npx prisma studio`

