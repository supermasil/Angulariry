import { CarrierDetail } from './carrier-detail.model';
import { FeeModel } from './fee.model';
import { TrackingDetailModel } from './tracking-details.model';

export interface TrackerModel {
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
  tracking_details: [TrackingDetailModel];
  carrier_detail: CarrierDetail;
  public_url: string;
  fees: [FeeModel];
  created_at: Date;
  updated_at: Date;
}
