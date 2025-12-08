This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

## 認証セットアップ

NextAuth + Prisma でユーザーログインを利用するために、以下の初期設定を行ってください。

1. `.env.example` を参考に `.env` を作成し、`NEXTAUTH_SECRET` を十分に長いランダム文字列へ変更する。
2. データベースを初期化: `npx prisma migrate dev --name init`
3. ユーザーを作成する。例: `npx prisma studio` で `User` レコードを追加し、`hashedPassword` には `node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"` で生成したハッシュを貼り付ける。
4. `npm run dev` を実行して [http://localhost:3001](http://localhost:3001) にアクセスする。

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


