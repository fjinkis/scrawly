const axios = require("axios");
const { logger } = require("./logger");

async function sendRequest(payload) {
  logger.debug(
    `Attempting to perform a ${payload.method} request to ${payload.url}`
  );
  const { data, status } = await axios(payload);
  logger.debug(`Response: ${JSON.stringify({ data, status })}`);
  const isString = typeof data === "string" || data instanceof String;
  if (!data || (isString && data.includes("ERROR")) || status > 300) {
    throw new Error(data);
  }

  return data.request;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollForRequestResults(
  apiKey,
  requestId,
  retries = 30,
  delay = 10000
) {
  const NEXT_ATTEMPT = 1;
  let text = undefined;
  let notFound = true;
  let currentRetry = 0;
  while (notFound && currentRetry < retries) {
    try {
      text = await sendRequest({
        method: "GET",
        url: `http://2captcha.com/res.php?key=${apiKey}&action=get&id=${requestId}&json=1`,
      });
      logger.info(`2captcha returned us: ${text}`);
      if (text.includes("NOT_READY")) {
        throw new Error(text);
      }
      notFound = false;
    } catch {
      currentRetry += NEXT_ATTEMPT;
      logger.info(
        `(${currentRetry}/${retries}) API didn't resolve de CAPTCHA yet. Retrying...`
      );
      await sleep(delay);
    }
  }

  if (notFound) {
    throw new Error(
      `After ${retries} the API didn't resolve the captcha. Skipping this captcha`
    );
  }

  return text;
}
async function initiateRequest(captchaApiKey, body) {
  const data = {
    method: "base64",
    regsense: 1,
    key: captchaApiKey,
    body,
    json: 1,
  };
  return await sendRequest({
    method: "POST",
    url: "http://2captcha.com/in.php",
    data,
  });
}

module.exports = { initiateRequest, pollForRequestResults, sleep };
