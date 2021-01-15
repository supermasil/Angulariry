import { ConsolidatedTrackingModel } from "./consolidated-tracking.model";
import { GeneralInfoModel } from "./general-info.model";

export interface MasterTrackingModel { // From backend
  _id: string;
  trackingNumber: string;
  consolidatedTrackings: ConsolidatedTrackingModel[];
  generalInfo: GeneralInfoModel;
  createdAt: Date;
  updatedAt: Date;
}




