import { GeneralInfoModel } from "./general-info.model";
import { InPersonTrackingModel } from "./in-person-tracking.model";
import { MasterTrackingModel } from "./master-tracking.model";
import { OnlineTrackingModel } from "./online-tracking.model";
import { ServicedTrackingModel } from "./serviced-tracking.model";

export interface ConsolidatedTrackingModel { // From backend
  _id: string;
  trackingNumber: string;
  onlineTrackings: OnlineTrackingModel[];
  servicedTrackings: ServicedTrackingModel[];
  inPersonTrackings: InPersonTrackingModel[];
  generalInfo: GeneralInfoModel;
  linkedTo: MasterTrackingModel;
  createdAt: Date;
  updatedAt: Date;
}




