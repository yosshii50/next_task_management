import nodemailer from "nodemailer";

type ParentApprovalMailParams = {
  to: string;
  childEmail: string;
  childName?: string | null;
  parentName?: string | null;
  approvalUrl: string;
  expiresAt: Date;
};

function ensureMailerConfig() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.MAIL_FROM ?? user;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!host || !user || !pass) {
    throw new Error("メール送信設定が不足しています。SMTP_HOST / SMTP_USER / SMTP_PASSWORD を確認してください。");
  }

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    }),
    from,
  };
}

export async function sendParentApprovalEmail(params: ParentApprovalMailParams) {
  const { transporter, from } = ensureMailerConfig();
  const childLabel = params.childName?.trim() || "新規メンバー";
  const parentLabel = params.parentName?.trim() || "ご担当者様";

  const subject = "【FlowBase】新規アカウント有効化のご確認";

  const text = [
    `${parentLabel}`,
    "",
    "以下のユーザーから招待による新規アカウント作成が行われました。",
    `氏名: ${childLabel}`,
    `メールアドレス: ${params.childEmail}`,
    "",
    "以下のリンクから有効化を承認してください。",
    params.approvalUrl,
    "",
    `有効期限: ${params.expiresAt.toLocaleString("ja-JP")}`,
  ].join("\n");

  const html = `
    <p>${parentLabel}</p>
    <p>以下のユーザーから招待による新規アカウント作成が行われました。</p>
    <ul>
      <li>氏名: ${childLabel}</li>
      <li>メールアドレス: ${params.childEmail}</li>
    </ul>
    <p>以下のリンクから有効化を承認してください。</p>
    <p><a href="${params.approvalUrl}" target="_blank" rel="noopener noreferrer">アカウントを有効化する</a></p>
    <p>有効期限: ${params.expiresAt.toLocaleString("ja-JP")}</p>
  `;

  await transporter.sendMail({
    from,
    to: params.to,
    subject,
    text,
    html,
  });
}
