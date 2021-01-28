import { ConsolidatedTrackingModel } from "./consolidated-tracking.model";
import { GeneralInfoModel } from "./general-info.model";

export interface MasterTrackingBox {
  boxNumber: number;
  palletNumber: number;
  items: ConsolidatedTrackingModel[];
  content: string;
}

export interface MasterTrackingModel { // From backend
  _id: string;
  trackingNumber: string;
  boxes: MasterTrackingBox[];
  generalInfo: GeneralInfoModel;
  createdAt: Date;
  updatedAt: Date;
}




