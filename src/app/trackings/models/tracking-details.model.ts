import { TrackingLocation } from './tracking-location.model';

export interface TrackingDetail {
  object: string,
  message: string,
  status: string,
  status_detail: string,
  datetime: Date,
  source: string,
  tracking_location: TrackingLocation
}
