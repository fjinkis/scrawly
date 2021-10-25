const { init } = require("./api/interface");
const { initiateRequest, pollForRequestResults } = require("./api/utils");
const config = require("./config.json");
const { sendEmail } = require("./api/mail");
const { logger } = require("./api/logger");
const {
  getCaptchaSelector,
  resolveCaptcha,
  checkResult,
} = require("./api/custom/american");

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
    const site = config.captcha.site;
    await interfaceHandler.visitPage(site);

    const captchaToResolve = await getCaptchaSelector(interfaceHandler);

    const requestId = await initiateRequest(
      config.captcha.key,
      captchaToResolve,
      site
    );
    logger.info(`The captcha that we sent has the following ID: ${requestId}`);
    const response = await pollForRequestResults(config.captcha.key, requestId);
    logger.info(`Captcha decoded: ${response}`);
    await resolveCaptcha(interfaceHandler, {
      username: config.user,
      password: config.password,
      response,
    });
    const result = await checkResult(interfaceHandler);
    if (result) {
      logger.info("We are sending the email to notify you!");
      notFound = false;
      await sendEmail();
    }
  } catch (err) {
    logger.error(`Error: ${err.message}`);
  }
  if (interfaceHandler) await interfaceHandler.close();
  logger.info(`Ending the program. It will run in 10 minutes! Bye`);
}

(async () => {
  await mainProcess();
  process.exit(0);
})();
