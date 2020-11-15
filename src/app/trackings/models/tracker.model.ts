import { CarrierDetail } from './carrier-detail.model';
import { Fee } from './fee.model';
import { TrackingDetail } from './tracking-details.model';

export interface Tracker {
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
  tracking_details: [TrackingDetail];
  carrier_detail: CarrierDetail;
  public_url: string;
  fees: [Fee];
  created_at: Date;
  updated_at: Date;
}
