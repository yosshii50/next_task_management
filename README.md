# Next Task Management

Next.js (App Router) + Prisma + NextAuth で作られたタスク管理ダッシュボードです。管理者はダッシュボード先頭で総アカウント数と総タスク数を確認できます。

## すぐ試す
- 依存関係: `npm install`
- 環境変数: `.env.example` を `.env` にコピーし、ポートに合わせて `NEXTAUTH_URL=http://localhost:3001` を必ず上書き。
- DB 初期化: `npx prisma migrate dev --name init`
- ユーザー作成: `npx prisma studio` で `User` にメール・ハッシュ化パスワード・`isAdmin` を必要に応じ設定  
  ハッシュ生成例: `node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"`
- 起動: `npm run dev` → http://localhost:3001

## 詳細ドキュメント
- セットアップ手順: `docs/setup.md`
- アーキテクチャとデータモデル: `docs/architecture.md`
- 運用・デプロイ・トラブルシュート: `docs/ops.md`
- 開発ルール: `CONTRIBUTING.md`

主要画面は `app/dashboard` と `app/tasks` にあります。UI やロジックを変える際は上記ドキュメントを参照してください。
