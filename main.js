const { init } = require("./api/interface");
const { initiateRequest, pollForRequestResults } = require("./api/utils");
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
  let interfaceHandler;
  try {
    interfaceHandler = await init();
    await interfaceHandler.visitPage(captcha.site);
    const catchaUrl = await getCaptchaSelector(interfaceHandler);

    logger.info("We are translating the captcha image to base64");
    const base64Captcha = await getCaptchaImageinBase64(
      interfaceHandler.browser,
      catchaUrl
    );
    const requestId = await initiateRequest(captcha.key, base64Captcha);
    logger.info(`The captcha that we sent has the following ID: ${requestId}`);
    const response = await pollForRequestResults(captcha.key, requestId);
    logger.info(`Captcha decoded: ${response}`);
    await resolveCaptcha(interfaceHandler, response);
    const result = await checkResult(interfaceHandler);
    if (result) {
      logger.info("We are sending the email to notify you!");
      notFound = false;
      await sendEmail();
    }
  } catch (err) {
    handleErrors(err);
  }
  if (interfaceHandler) interfaceHandler.close();
  logger.info(`Ending the program. It will run in 10 minutes! Bye`);
}

(async () => {
  await mainProcess();
  process.exit(0);
})();
