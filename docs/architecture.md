# アーキテクチャ概要

## 技術スタック
- Next.js 14 (App Router)
- React 18 + SWR（ダッシュボードのポーリング更新）
- Tailwind CSS
- NextAuth (Credentials) + Prisma + PostgreSQL
- Prisma Schema: `prisma/schema.prisma`

## 主要フロー
1. `/dashboard`  
   - `getDashboardData(userId, includeAdminSummary)` でサーバー側プリフェッチ。  
   - クライアントでは `useSWR("/api/dashboard")` で 5 秒ごとに再取得。  
   - 管理者 (`session.user.isAdmin=true`) のみ総アカウント数・総タスク数を先頭に表示。
2. `/tasks`  
   - 同じデータ取得関数を使い、作成・編集・削除を集中管理。
3. `/api/dashboard`  
   - NextAuth セッションから `userId` を読み取り、認証必須。  
   - 管理者であれば `user`/`task` の `count` を追加して返却。

## 認証・セッション
- NextAuth Credentials Provider。メール+パスワードを `User.hashedPassword` で照合。
- JWT セッションに `id`, `email`, `name`, `isAdmin` を格納し、`session` コールバックで最新 DB 値に同期。
- 非アクティブ (`isActive=false`) ユーザーはログイン拒否。

## データモデル（抜粋）
- `User`  
  - `isAdmin` (Boolean): 管理者フラグ。今回のダッシュボード集計表示に使用。  
  - `isActive`: 無効化判定に利用。
- `Task`  
  - `status` (TODO / IN_PROGRESS / DONE)  
  - `startDate`, `dueDate` (DateTime, 任意)  
  - 親子関係は `TaskRelation` で多対多リンク。
- `WeeklyHoliday`, `Holiday`  
  - 祝日表示・週次休日の計算に利用。

## UI コンポーネント構成（主要）
- `app/dashboard/dashboard-content.tsx` : ダッシュボード本体。SWR で最新化、タスク一覧/ツリー/カレンダー、管理者サマリー表示。
- `app/dashboard/components/*` : タスク作成・編集モーダル、リスト/ツリー表示。
- `lib/dashboard-data.ts` : ダッシュボード用データ取得の単一エントリポイント。

## パフォーマンスと再検証
- SWR の `refreshInterval: 5000` で軽量ポーリング。SSR 時点のデータを `fallbackData` で即描画。
- ミューテーション後は `mutate()` を呼び再取得。サーバー側アクションは `revalidatePath("/dashboard")` を使用。

