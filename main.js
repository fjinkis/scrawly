const { init } = require("./api/interface");
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
  handleErrors,
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
  let interfaceHandler;
  const RETRY_DELAY_IN_MIN = 10;
  const MIN_IN_MILISECONDS = 60000;
  while (notFound) {
    try {
      interfaceHandler = await init();
      await interfaceHandler.visitPage(captcha.site);
      const catchaUrl = await getCaptchaSelector(interfaceHandler);

      logger.notice("We are translating the captcha image to base64");
      const base64Captcha = await getCaptchaImageinBase64(
        interfaceHandler.browser,
        catchaUrl
      );
      const requestId = await initiateRequest(captcha.key, base64Captcha);
      logger.notice(
        `The captcha that we sent has the following ID: ${requestId}`
      );
      const response = await pollForRequestResults(captcha.key, requestId);
      logger.notice(`Captcha decoded: ${response}`);
      await resolveCaptcha(interfaceHandler, response);
      const result = await checkResult(interfaceHandler);
      if (result) {
        logger.notice("We are sending the email to notify you!");
        notFound = false;
        await sendEmail();
      }
    } catch (err) {
      handleErrors(err);
    }
    if (interfaceHandler) interfaceHandler.close();
    logger.info(`Going to sleep for ${RETRY_DELAY_IN_MIN} minutes!`);
    await sleep(RETRY_DELAY_IN_MIN * MIN_IN_MILISECONDS);
  }
}

(async () => {
  await mainProcess();
  process.exit(1);
})();
