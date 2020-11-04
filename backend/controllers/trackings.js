const EasyPost = require('@easypost/api');
const api = new EasyPost("EZAK0777fe1395a9438f84544006152b0bf3gfhWyjEEllIE2WTw2ZLGmQ");

// const apiKey = new Api(process.env.easyPostApiKey, {
//   timeout: 120000,
//   baseUrl: "https://api.easypost.com/v2/",
//   useProxy: false,
//   superagentMiddleware: s => s,
//   requestMiddleware: r => r,
// });



exports.getTrackingInfo = (req, res, next) => {
  console.log("123");
  const tracker = new api.Tracker({
    tracking_code: "9361289711091140601966",
    carrier: "USPS"
  });

  tracker.save()
    .then(response => console.log(response))
    .catch(error => console.log(error));
}
