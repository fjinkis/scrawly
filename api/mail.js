const mailgun = require("mailgun-js");
const { mail } = require("./../config.json");

async function sendEmail() {
  const mg = mailgun({ apiKey: mail.key, domain: mail.domain });
  const body = await mg.messages().send(mail.data);
  logger.info(body);
}

module.exports = { sendEmail };
