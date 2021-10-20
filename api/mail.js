const mailgun = require("mailgun-js");
const { logger } = require("./logger");
const { mail } = require("./../config.json");

async function sendEmail() {
  const mg = mailgun({ apiKey: mail.key, domain: mail.domain });
  const body = await mg.messages().send(mail.data);
  logger.debug(JSON.stringify(body));
}

module.exports = { sendEmail };
