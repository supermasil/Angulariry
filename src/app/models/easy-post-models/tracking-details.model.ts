import { TrackingLocationModel } from './tracking-location.model';

export interface TrackingDetailModel {
  object: string;
  message: string;
  status: string;
  status_detail: string;
  datetime: Date;
  source: string;
  tracking_location: TrackingLocationModel;
}
