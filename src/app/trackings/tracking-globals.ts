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

  public static allStatusTypes = {
    Unknown: "Unknown",
    Created: "Created",
    Pending: "Pending",
    BeingShippedToOrigin: "Being shipped to origin",
    ReceivedAtOrigin: "Received at origin",
    Consolidated: "Consolidated",
    ReadyToFly: "Ready to fly",
    BeingShippedToDestination: "Being shipped to destination",
    ReceivedAtDestination: "Received at destination",
    BeingDeliveredToRecipient: "Being delivered to recipient",
    DeliveredToRecipient: "Delivered to recipient"
  }

  public static getBadgeColor = (status: string) => {
    switch (status) {
      case TrackingGlobals.allStatusTypes.Unknown:
        return "#f44336"
      case TrackingGlobals.allStatusTypes.Created:
        return "#ff5722"
      case TrackingGlobals.allStatusTypes.Pending:
        return "#607d8b"
      case TrackingGlobals.allStatusTypes.BeingShippedToOrigin:
        return "#e91e63"
      case TrackingGlobals.allStatusTypes.ReceivedAtOrigin:
        return "#9c27b0"
      case TrackingGlobals.allStatusTypes.Consolidated:
        return "#e040fb"
      case TrackingGlobals.allStatusTypes.ReadyToFly:
        return "#03a9f4"
      case TrackingGlobals.allStatusTypes.BeingShippedToDestination:
        return "#ffeb3b"
      case TrackingGlobals.allStatusTypes.ReceivedAtDestination:
        return "#8bc34a"
      case TrackingGlobals.allStatusTypes.BeingDeliveredToRecipient:
        return "#ccff90"
      case TrackingGlobals.allStatusTypes.DeliveredToRecipient:
        return "#76ff03"
    }
  }

  public static statuses = Object.values(TrackingGlobals.allStatusTypes);
  public static postCreationStatuses = [...TrackingGlobals.statuses].splice(4);
  public static postConsolidationStatuses = [...TrackingGlobals.statuses].splice(5);


  public static defaultPageSizes = [10, 20, 50, 100];
}
