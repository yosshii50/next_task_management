このリポジトリは [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) で生成した [Next.js](https://nextjs.org) プロジェクトです。

## 開発サーバーの起動手順

1. 依存関係をインストール: `npm install`
2. 以下のいずれかのコマンドで開発サーバーを開始:

```bash
npm run dev
# または
yarn dev
# または
pnpm dev
# または
bun dev
```

ブラウザで [http://localhost:3001](http://localhost:3001) を開くと、最新の画面を確認できます。

## 認証セットアップ

NextAuth + Prisma によるユーザーログイン機能を利用するには、次の初期設定を行ってください。

1. `.env.example` をコピーして `.env` を作成し、`NEXTAUTH_SECRET` に十分に長いランダム文字列、`NEXTAUTH_URL` に `http://localhost:3001` を設定する。
2. データベースを初期化: `npx prisma migrate dev --name init`
3. ユーザーを登録:
   - `npx prisma studio` を実行
   - `User` モデルで `email` と `hashedPassword`（下記コマンドで生成）を入力
   - `node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"`
4. `npm run dev` を実行し、[http://localhost:3001](http://localhost:3001) でログインを確認する。

画面の編集は `app/page.tsx` を更新してください。保存するとホットリロードで即座に反映されます。

フォントは [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) を利用しており、Vercel が提供する [Geist](https://vercel.com/font) が自動最適化されます。

## 参考資料

- [Next.js ドキュメント](https://nextjs.org/docs)
- [Learn Next.js チュートリアル](https://nextjs.org/learn)
- [Next.js GitHub リポジトリ](https://github.com/vercel/next.js)

## デプロイ

Next.js アプリを最も手軽にデプロイするには、Next.js の開発元 Vercel が提供する [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) をご利用ください。詳細な手順は [デプロイガイド](https://nextjs.org/docs/app/building-your-application/deploying) を参照してください。
