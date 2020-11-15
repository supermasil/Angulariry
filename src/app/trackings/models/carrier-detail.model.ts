import { Time } from '@angular/common';

export interface CarrierDetail {
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
}
