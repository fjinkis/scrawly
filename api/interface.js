const puppeteer = require("puppeteer");

const interface = {
  browser: null,
  page: null,
  init: async () => {
    this.browser = await puppeteer.launch({
      args: [
        // `--proxy-server=http=${randProxy}`,
        // "--incognito",
      ],
      headless: true,
      slowMo: 100,
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1279, height: 768 });
    return {
      browser: this.browser,
      page: this.page,
      visitPage: async (url) => {
        await this.page.goto(url);
      },

      close: async () => {
        await this.browser.close();
      },

      /**
       * Runs querySelectorAll on whatever selector is passed in.
       * Then maps over returned values, finds the attribute that was passed in and returns those values as an array.
       * @param {string} selector
       * @param {string} attribute
       * @returns {Array[]}
       */
      querySelectorAllAttributes: async (selector, attribute) => {
        return await this.page.$$eval(
          selector,
          (elements, attribute) => {
            return elements.map((element) => element[attribute]);
          },
          attribute
        );
      },

      /**
       * Runs querySelector on whatever selector is passed in.
       * Then maps over returned value, finds the attribute that was passed in and returns that value.
       * @param {string} selector
       * @param {string} attribute
       * @returns {Array[]}
       */
      querySelectorAttribute: async (selector, attribute) => {
        return await this.page.$eval(
          selector,
          (element, attribute) => {
            return element[attribute];
          },
          attribute
        );
      },

      /**
       * Runs querySelector on whatever selector is passed in.
       * Selector should be an input field
       * Then pass value into input field
       * @param {string} selector
       * @param {string} input
       * @return void
       */
      querySelectorInputAndType: async (selector, input) => {
        return await this.page.type(selector, input);
      },

      /**
       * Runs querySelector on whatever selector is passed in.
       * Selector should be an button
       * Clicks button
       * @param {string} selector
       * @return void
       */
      querySelectorButtonAndClick: async (selector) => {
        return await this.page.click(selector);
      },

      /**
       * Simple wrapper for Puppeteer evaulate function
       * Visit https://pptr.dev/#?product=Puppeteer&version=v10.1.0&show=api-pageevaluatepagefunction-args for more info
       * @param {string} data
       * @return void
       */
      evaluatePage: async (data) => {
        return await this.page.evaluate(data);
      },
    };
  },
};

module.exports = { init: interface.init };
