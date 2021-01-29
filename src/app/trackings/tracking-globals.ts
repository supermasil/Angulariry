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

  public static codesMapping = new Map([
    ["pre_transit", "Pre Transit"],
    ["in_transit", "In Transit"],
    ["out_for_delivery", "Out For Delivery"],
    ["delivered", "Delivered"],
    ["return_to_sender", "Return to Sender"],
    ["failure", "Failures"],
    ["unknown", "Unknown"]
  ]);

  public static trackingTypes = {
    ONLINE: "onl",
    SERVICED: "sev",
    INPERSON: "inp",
    CONSOLIDATED: "csl",
    MASTER: "mst"
  }

  public static statuses = ["Unknown", "Created", "Pending", , "Received", "Consolidated", "Ready to ship", "Shipped", "Arrived at Destination", "Delivering", "Delivered"];
  public static postCreatedStatuses = ["Consolidated", "Ready to ship", "Shipped", "Arrived at Destination", "Delivering", "Delivered"];
  public static postConsolidatedStatuses = ["Ready to ship", "Shipped", "Arrived at Destination", "Delivering", "Delivered"];
}
