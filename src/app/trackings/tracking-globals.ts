export class TrackingGlobals {
  // Alert Service
  public static carriers = [
    "UPS",
    "Fedex",
    "USPS",
    "DHLExpress",
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
    INPERSONSUB: "inpsub",
    CONSOLIDATED: "csl",
    MASTER: "mst"
  }

  public static trackingStatuses = {
    Unknown: "unknown",
    Created: "created",
    Pending: "pending",
    BeingShippedToOrigin: "being-shipped-to-origin",
    ReceivedAtOrigin: "received-at-origin",
    ReadyToFly: "ready-to-fly",
    Flying: "flying",
    ReceivedAtDestination: "received-at-destination",
    BeingDeliveredToRecipient: "being-delivered-to-recipient",
    DeliveredToRecipient: "delivered-to-recipient"
  }

  public static financialStatuses = {
    Unpaid: "paid",
    Paid: "unpaid",
    PartiallyPaid: "partially-paid"
  }

  public static allStatuses = Object.values(TrackingGlobals.trackingStatuses);
  public static allFinancialStatuses = Object.values(TrackingGlobals.financialStatuses);
  public static postReceivedAtOrigin = Object.values(TrackingGlobals.trackingStatuses).slice(4);
  public static postReadyToFly = Object.values(TrackingGlobals.trackingStatuses).slice(5);
  public static postFlying = Object.values(TrackingGlobals.trackingStatuses).slice(6);
  public static postReceivedAtDestination = Object.values(TrackingGlobals.trackingStatuses).slice(7);
  public static postDelivering = Object.values(TrackingGlobals.trackingStatuses).slice(8);
  public static postDelivered = Object.values(TrackingGlobals.trackingStatuses).slice(9);

  public static internalTrackingTypes = Object.values(TrackingGlobals.trackingTypes).slice(3);
  public static externalTrackingTypes = Object.values(TrackingGlobals.trackingTypes).slice(0, 3);

  public static defaultPageSizes = [10, 20, 50, 100];

  public static getBadgeColor = (status: string) => {
    switch (status) {
      case TrackingGlobals.trackingStatuses.Unknown:
        return "#f44336"
      case TrackingGlobals.trackingStatuses.Created:
        return "#ff5722"
      case TrackingGlobals.trackingStatuses.Pending:
        return "#607d8b"
      case TrackingGlobals.trackingStatuses.BeingShippedToOrigin:
        return "#e91e63"
      case TrackingGlobals.trackingStatuses.ReceivedAtOrigin:
        return "#9c27b0"
      case TrackingGlobals.trackingStatuses.ReadyToFly:
        return "#03a9f4"
      case TrackingGlobals.trackingStatuses.Flying:
        return "#ffeb3b"
      case TrackingGlobals.trackingStatuses.ReceivedAtDestination:
        return "#8bc34a"
      case TrackingGlobals.trackingStatuses.BeingDeliveredToRecipient:
        return "#ccff90"
      case TrackingGlobals.trackingStatuses.DeliveredToRecipient:
        return "#76ff03"
      case TrackingGlobals.financialStatuses.Unpaid:
        return "#e040fb"
      case TrackingGlobals.financialStatuses.Paid:
        return "#c060ff"
      case TrackingGlobals.financialStatuses.PartiallyPaid:
        return "#d35000"
      case 'Consolidated':
        return "#e040ff"
    }
  }

}
