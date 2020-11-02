const EasyPost = require('@easypost/api');

const api = new Api(process.env.easyPostApiKey, {
  timeout: 120000,
  baseUrl: "https://api.easypost.com/v2/",
  useProxy: false,
  superagentMiddleware: s => s,
  requestMiddleware: r => r,
});


