export class TrackingGlobals {
  // Alert Service
  public static carriers = [
    "UPS",
    "Fedex",
    "USPS",
    "AmazonMws",
    "OnTrac"
  ];

  public static preTransitCodes = [
    "pre_transit"
  ];

  public static inTransitCodes = [
    "in_transit",
    "out_for_delivery"
  ];

  public static deliveryCodes = [
    "delivered"
  ];

  public static failureCodes = [
    "return_to_sender",
    "failure",
    "unknown"
  ];
}
