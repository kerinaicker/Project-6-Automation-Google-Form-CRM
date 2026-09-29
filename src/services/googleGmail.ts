import { EmailTemplate, ClientLead } from '../types';

export function makeUrlSafeBase64(str: string): string {
  // UTF-8 safe base64 encoding
  const utf8Bytes = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  );
  return btoa(utf8Bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function compileEmailContent(
  template: EmailTemplate,
  lead: Pick<ClientLead, 'fullName' | 'email' | 'company' | 'service' | 'budgetNotes'>
): { subject: string; htmlBody: string; textBody: string } {
  const firstName = lead.fullName.split(' ')[0] || lead.fullName;
  const companyName = lead.company || 'your organization';
  const serviceName = lead.service || 'our services';

  const replaceTokens = (text: string) => {
    return text
      .replace(/{{Full Name}}/g, lead.fullName)
      .replace(/{{First Name}}/g, firstName)
      .replace(/{{Company}}/g, companyName)
      .replace(/{{Service}}/g, serviceName)
      .replace(/{{Email}}/g, lead.email)
      .replace(/{{Owner Email}}/g, template.ownerEmail);
  };

  const subject = replaceTokens(template.subject);
  const greeting = replaceTokens(template.greeting);
  const body = replaceTokens(template.body);
  const signature = replaceTokens(template.signature);

  const textBody = `${greeting}\n\n${body}\n\n${template.ctaText ? `${template.ctaText}: ${template.ctaUrl}\n\n` : ''}${signature}`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f9fafb; }
          .container { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; }
          .header { background: #1e3a8a; padding: 24px 32px; color: #ffffff; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
          .content { padding: 32px; font-size: 15px; }
          .greeting { font-weight: 600; font-size: 16px; margin-bottom: 16px; color: #111827; }
          .message { margin-bottom: 24px; color: #374151; white-space: pre-line; }
          .lead-summary { background: #f3f4f6; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 0 6px 6px 0; }
          .lead-summary h4 { margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #4b5563; }
          .lead-summary p { margin: 4px 0; font-size: 14px; color: #1f2937; }
          .cta-btn { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin: 16px 0; }
          .footer { padding: 20px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Our Client Portal</h1>
          </div>
          <div class="content">
            <div class="greeting">${greeting}</div>
            <div class="message">${body}</div>
            
            <div class="lead-summary">
              <h4>Received Submission Details</h4>
              <p><strong>Service Requested:</strong> ${serviceName}</p>
              ${lead.company ? `<p><strong>Company:</strong> ${lead.company}</p>` : ''}
              ${lead.budgetNotes ? `<p><strong>Notes:</strong> ${lead.budgetNotes}</p>` : ''}
            </div>

            ${
              template.ctaUrl && template.ctaText
                ? `<p><a href="${template.ctaUrl}" class="cta-btn" target="_blank">${template.ctaText}</a></p>`
                : ''
            }

            <p style="margin-top: 24px; color: #4b5563;">${signature.replace(/\n/g, '<br>')}</p>
          </div>
          <div class="footer">
            <p style="margin: 0;">Automated Welcome Dispatch • Sent securely via Google Workspace CRM</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return { subject, htmlBody, textBody };
}

export async function sendGmailWelcomeEmail(
  accessToken: string,
  template: EmailTemplate,
  lead: Pick<ClientLead, 'fullName' | 'email' | 'company' | 'service' | 'budgetNotes'>
): Promise<{ messageId: string; threadId: string }> {
  const { subject, htmlBody, textBody } = compileEmailContent(template, lead);

  const recipients = [lead.email];
  if (template.sendCopyToOwner && template.ownerEmail && template.ownerEmail !== lead.email) {
    recipients.push(template.ownerEmail);
  }

  const boundary = `__crm_boundary_${Date.now()}__`;
  const rawMessage = [
    `To: ${lead.email}`,
    template.sendCopyToOwner && template.ownerEmail ? `Cc: ${template.ownerEmail}` : '',
    `Subject: =?UTF-8?B?${btoa(encodeURIComponent(subject))}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    textBody,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody,
    '',
    `--${boundary}--`,
  ]
    .filter(Boolean)
    .join('\r\n');

  const encodedMessage = makeUrlSafeBase64(rawMessage);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedMessage }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gmail API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return { messageId: data.id, threadId: data.threadId };
}

export async function getGmailProfile(accessToken: string): Promise<{ emailAddress: string; messagesTotal: number }> {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to load Gmail profile: ${await res.text()}`);
  }

  return res.json();
}
