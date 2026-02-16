# 開発ガイドライン

## ブランチ/コミット
- 既存の変更は元に戻さず、関連差分のみを加える。
- コミットは小さく意味のある単位でまとめる（amend は明示要望がない限り不可）。

## コーディング方針
- TypeScript / React (App Router) を前提とし、Tailwind クラスでスタイル付け。
- 読みやすさ重視。複雑なロジックには短いコメントを添える。
- 管理者機能は `session.user.isAdmin` を用いたガードを忘れない。

## 事前チェック
- Lint: `npm run lint`
- ビルド: `npm run build`
- 型（ウォッチ）: `npm run typecheck`

## データベース作業
- スキーマ変更は `npx prisma migrate dev --name <change>` でマイグレーションを追加。
- モデル追加時は `prisma/schema.prisma` を更新し、`prisma generate` を再実行。

## 開発サーバー
- `npm run dev` （ポート 3001）。`NEXTAUTH_URL` も 3001 に揃えること。

## PR のチェックリスト
- [ ] `.env` 変更が必要な場合はドキュメントを更新したか
- [ ] 新規 API には認証ガードがあるか
- [ ] UI 変更は主要パス（/dashboard, /tasks）で確認したか

