# 運用・デプロイ・トラブルシュート

## よく使うコマンド
- 開発: `npm run dev`（ポート 3001）
- 本番ビルド: `npm run build`
- 本番起動: `npm start`（同ポート 3001）
- Lint: `npm run lint`
- Prisma Studio: `npx prisma studio`
- マイグレーション生成: `npx prisma migrate dev --name <name>`

## デプロイのポイント
- `NEXTAUTH_URL` と `APP_BASE_URL` を実際のホスト・ポートに合わせること（ズレると認証が失敗）。
- `DATABASE2_PRISMA_DATABASE_URL` は app user、`DATABASE2_POSTGRES_URL` は接続用 DSN。単一 DSN なら両方同じ値で問題なし。
- 環境変数はビルド時と起動時で同一にそろえる。
- ポートは `package.json` で 3001 に固定されているため、別ポートで動かす場合は `dev` / `start` スクリプトを変更する。

## トラブルシュート
- 認証 401 / CSRF エラー  
  - `NEXTAUTH_URL` が 3000 のまま、または HTTPS/ドメイン不一致のケースが多い。`.env` を確認。
- DB 接続エラー  
  - DSN の末尾にデータベース名があるか確認。VPC 内接続が必要な場合は `directUrl` も正しいか確認。
- スキーマ差分でエラー  
  - `npx prisma generate` を再実行。必要なら `npx prisma migrate dev`。
- ダッシュボードでサマリーが表示されない  
  - ログインユーザーの `isAdmin` が `true` か、`/api/dashboard` レスポンスに `adminSummary` が含まれているか確認。

## バックアップ/メンテ
- 定期バックアップは DB 側の仕組みに委任。アプリ側では状態を持たない。
- メンテナンス表示を行う場合は、リバースプロキシ側で 503 を返すか、Next.js で `/maintenance` を用意しリダイレクトする運用を推奨。

