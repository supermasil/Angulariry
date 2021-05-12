export class TrackingGlobals {

  public static carriers = {
    "UPS": "UPS",
    "Fedex": "Fedex",
    "USPS": "USPS",
    "DHLExpress": "DHLExpress",
    "AmazonMws": "AmazonMws",
    "OnTrac": "OnTrac"
  };

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
    INPERSON: "inp",
    CONSOLIDATED: "csl",
    MASTER: "mst",
    INPERSONSUB: "inpsub",
    SERVICED: "sev",
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
    Unpaid: "unpaid",
    Paid: "paid",
    PartiallyPaid: "partially-paid"
  }

  public static allTrackingStatuses = Object.values(TrackingGlobals.trackingStatuses);
  public static allFinancialStatuses = Object.values(TrackingGlobals.financialStatuses);
  public static postReceivedAtOrigin = Object.values(TrackingGlobals.trackingStatuses).slice(4);
  public static postReadyToFly = Object.values(TrackingGlobals.trackingStatuses).slice(5);
  public static postFlying = Object.values(TrackingGlobals.trackingStatuses).slice(6);
  public static postReceivedAtDestination = Object.values(TrackingGlobals.trackingStatuses).slice(7);
  public static postDelivering = Object.values(TrackingGlobals.trackingStatuses).slice(8);
  public static postDelivered = Object.values(TrackingGlobals.trackingStatuses).slice(9);

  public static internalTrackingTypes = Object.values(TrackingGlobals.trackingTypes).slice(3, 5);
  public static externalTrackingTypes = Object.values(TrackingGlobals.trackingTypes).slice(0, 3);
  public static allTrackingTypes = Object.values(TrackingGlobals.trackingTypes).slice(0, 5);

  public static getBadgeColor = (status: string) => {
    switch (status) {
      case TrackingGlobals.trackingStatuses.Unknown:
        return "bg-gray-light text-gray"
      case TrackingGlobals.trackingStatuses.Created:
        return "bg-deep-orange-light text-deep-orange"
      case TrackingGlobals.trackingStatuses.Pending:
        return "bg-deep-orange-light text-deep-orange"
      case TrackingGlobals.trackingStatuses.BeingShippedToOrigin:
        return "bg-deep-orange-light text-deep-orange"
      case TrackingGlobals.trackingStatuses.ReceivedAtOrigin:
        return "bg-orange-light text-orange"
      case TrackingGlobals.trackingStatuses.ReadyToFly:
        return "bg-orange-light text-orange"
      case TrackingGlobals.trackingStatuses.Flying:
        return "bg-orange-light text-orange"
      case TrackingGlobals.trackingStatuses.ReceivedAtDestination:
        return "bg-amber-light text-amber"
      case TrackingGlobals.trackingStatuses.BeingDeliveredToRecipient:
        return "bg-amber-light text-amber"
      case TrackingGlobals.trackingStatuses.DeliveredToRecipient:
        return "bg-green-light text-green"
      case TrackingGlobals.financialStatuses.Unpaid:
        return "bg-red-light text-red"
      case TrackingGlobals.financialStatuses.Paid:
        return "bg-green-light text-green"
      case TrackingGlobals.financialStatuses.PartiallyPaid:
        return "bg-amber-light text-amber"
      case 'Consolidated':
        return "bg-green-light text-green"
    }
  }

}
