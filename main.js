const interface = require("./api/interface");
const {
  initiateRequest,
  pollForRequestResults,
  sleep,
} = require("./api/utils");
const { captcha } = require("./config.json");
const { sendEmail } = require("./api/mail");
const { logger } = require("./api/logger");
const {
  getCaptchaSelector,
  resolveCaptcha,
  checkResult,
} = require("./api/custom/polska");

async function getCaptchaImageinBase64(browser, url) {
  const page = await browser.newPage();
  await page.goto(url);
  const imageInBase64 = await page.screenshot({
    encoding: "base64",
    omitBackground: true,
  });
  page.close();
  return imageInBase64;
}

async function mainProcess() {
  let notFound = true;
  const RETRY_DELAY_IN_MIN = 10;
  const MIN_IN_MILISECONDS = 60000;
  while (notFound) {
    try {
      await interface.init();
      await interface.visitPage(captcha.site);
      const catchaUrl = await getCaptchaSelector(interface);

      logger.info("We are translating the captcha image to base64");
      const base64Captcha = await getCaptchaImageinBase64(
        interface.browser,
        catchaUrl
      );
      const requestId = await initiateRequest(captcha.key, base64Captcha);
      logger.info(
        `The captcha that we sent has the following ID: ${requestId}`
      );
      const response = await pollForRequestResults(captcha.key, requestId);
      logger.info(`Captcha decoded: ${response}`);
      await resolveCaptcha(interface, response);
      const result = await checkResult(interface);
      if (result) {
        logger.info("We are sending the email to notify you!");
        notFound = false;
        await sendEmail();
      }
    } catch (err) {
      logger.error(`Error: ${err.message}`);
    }
    logger.info(`Going to sleep for ${RETRY_DELAY_IN_MIN} minutes!`);
    sleep(RETRY_DELAY_IN_MIN * MIN_IN_MILISECONDS);
  }
}

(async () => {
  await mainProcess();
  process.exit(1);
})();
