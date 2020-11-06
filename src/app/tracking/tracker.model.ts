import { Time } from '@angular/common';

export interface Tracker {
  // id: string;
  // tracking_code: string;
  // carrier: string;
  // origin_location: string;
  // destination_location: string;
  // signed_by: string;
  // status: string;
  // initial_delivery_attempt: string;
  // created_at: Date;
  // updated_at: Date;
  // weight: number;
  // est_delivery_date_local: string;
  // est_delivery_time_local: string;
  // guaranteed_delivery_date: string
  // shipping_details: [{
  //   datetime: Date,
  //   description: string,
  //   status: string,
  //   status_detail: string,
  //   tracking_location: {
  //     city: string,
  //     state: string,
  //     country: string
  //   }
  // }];
  id: string;
  object: string;
  mode: string;
  tracking_code: string;
  status: string;
  signed_by: string;
  weight: number;
  est_delivery_date: Date;
  shipment_id: string;
  carrier: string;
  tracking_details: [{
    object: string,
    message: string,
    status: string,
    status_detail: string,
    datetime: Date,
    source: string,
    tracking_location: {
      object: string,
      city: string,
      state: string,
      country: string,
      zip: string
    }
  }];
  carrier_detail: {
    object: string,
    service: string,
    container_type: string,
    est_delivery_date_local: Date,
    est_deliver_time_local: Time,
    origin_location: string,
    origin_tracking_location: {
      object: string,
      city: string,
      state: string,
      country: string,
      zip: string
    },
    destination_location: string,
    destination_tracking_location: {
      object: string,
      city: string,
      state: string,
      country: string,
      zip: string
    },
    guranteed_delivery_date: Date,
    alternate_identifier: string,
    initial_delivery_attempt: Date
  };
  public_url: string;
  fees: [{
    object: string,
    type: string,
    amount: string,
    charged: boolean,
    refunded: boolean
  }];
  created_at: Date;
  updated_at: Date;
}
