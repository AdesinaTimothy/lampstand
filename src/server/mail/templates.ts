import "server-only";

export type EmailContent = { subject: string; html: string; text: string };

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function layout(opts: { org: string; heading: string; paragraphs: string[]; cta?: { label: string; url: string }; footnote?: string }) {
  const paragraphs = opts.paragraphs.map((p) => `<p style="margin:0 0 16px;line-height:1.6">${escape(p)}</p>`).join("");
  const cta = opts.cta
    ? `<p style="margin:28px 0"><a href="${escape(opts.cta.url)}" style="background:#1f5145;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;display:inline-block">${escape(opts.cta.label)}</a></p>
       <p style="margin:0 0 16px;font-size:13px;color:#5c6863;line-height:1.5">Or paste this link into your browser:<br><span style="word-break:break-all">${escape(opts.cta.url)}</span></p>`
    : "";
  const footnote = opts.footnote ? `<p style="margin:24px 0 0;font-size:13px;color:#7c8781">${escape(opts.footnote)}</p>` : "";
  const html = `<!doctype html><html><body style="margin:0;background:#fbfaf7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#18211e">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border:1px solid #e5e1d6;border-radius:14px" cellpadding="0" cellspacing="0"><tr><td style="padding:36px 32px">
<p style="margin:0 0 24px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#1f5145;font-weight:600">${escape(opts.org)}</p>
<h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:24px;font-weight:500;line-height:1.3">${escape(opts.heading)}</h1>
${paragraphs}${cta}${footnote}
</td></tr></table></td></tr></table></body></html>`;
  const text = [opts.heading, "", ...opts.paragraphs, ...(opts.cta ? ["", `${opts.cta.label}: ${opts.cta.url}`] : []), ...(opts.footnote ? ["", opts.footnote] : [])].join("\n");
  return { html, text };
}

export const emailTemplates = {
  verifyEmail(d: { org: string; name: string; url: string }): EmailContent {
    return {
      subject: `Confirm your email for ${d.org}`,
      ...layout({
        org: d.org,
        heading: `Welcome, ${d.name}`,
        paragraphs: ["Please confirm your email address to start learning. This link expires in 24 hours."],
        cta: { label: "Confirm email address", url: d.url },
        footnote: "If you didn't create an account, you can safely ignore this email.",
      }),
    };
  },
  passwordReset(d: { org: string; name: string; url: string }): EmailContent {
    return {
      subject: "Reset your password",
      ...layout({
        org: d.org,
        heading: "Reset your password",
        paragraphs: [`Hi ${d.name}, we received a request to reset your password. This link expires in 1 hour and can be used once.`],
        cta: { label: "Choose a new password", url: d.url },
        footnote: "If you didn't request this, no action is needed — your password hasn't changed.",
      }),
    };
  },
  passwordChanged(d: { org: string; name: string }): EmailContent {
    return {
      subject: "Your password was changed",
      ...layout({
        org: d.org,
        heading: "Your password was changed",
        paragraphs: [
          `Hi ${d.name}, the password for your account was just changed and other devices were signed out.`,
          "If this wasn't you, reset your password immediately and contact your church administrator.",
        ],
      }),
    };
  },
  notification(d: { org: string; title: string; body?: string | null; url?: string | null; cta?: string }): EmailContent {
    return {
      subject: d.title,
      ...layout({
        org: d.org,
        heading: d.title,
        paragraphs: d.body ? [d.body] : [],
        cta: d.url ? { label: d.cta ?? "Open", url: d.url } : undefined,
        footnote: "You can change email preferences in your account settings.",
      }),
    };
  },
};
