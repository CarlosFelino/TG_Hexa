import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

const mailer = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

const from = new Sender(
  "naoresponda@test-q3enl6kvmkr42vwr.mlsender.net",
  "Support Nexus"
);

export async function enviarEmailRedefinirSenha(nome, email, token) {
  const link = `https://seu_frontend_url/login.html?token=${token}`;
  const recipients = [new Recipient(email, nome)];

  const personalization = [{
    email,
    data: {
      name: nome,
      account_name: "Support Nexus",
      action_url: link,
    },
  }];

  const emailParams = new EmailParams()
    .setFrom(from)
    .setTo(recipients)
    .setSubject("Redefinição de senha")
    .setTemplateId("pr9084zyo18gw63d")
    .setPersonalization(personalization);

  await mailer.email.send(emailParams);
}