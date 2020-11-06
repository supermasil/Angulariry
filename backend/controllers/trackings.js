const EasyPost = require('@easypost/api');
const api = new EasyPost(process.env.easyPostApiKey);

// const apiKey = new Api(process.env.easyPostApiKey, {
//   timeout: 120000,
//   baseUrl: "https://api.easypost.com/v2/",
//   useProxy: false,
//   superagentMiddleware: s => s,
//   requestMiddleware: r => r,
// });



exports.getTrackingInfo = (req, res, next) => {
  const tracker = new api.Tracker({
    tracking_code: req.query.trackingNumber,
    carrier: req.query.carrier
  });

  return tracker.save()
    .then(response => {
      return res.status(200).json(response);
    })
    .catch(error => {
      console.log("getTrackingInfo: " + error.message)
      return res.status(500).json({message: "Something went wrong while looking for this package"})
    });
}
