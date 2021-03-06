import { ConsolidatedTrackingModel } from "./consolidated-tracking.model";
import { GeneralInfoModel } from "./general-info.model";
import { ListItemModel } from "./list-item.model";
import { MasterTrackingModel } from "./master-tracking.model";

export interface InPersonSubTrackingModel {
  _id: string;
  trackingNumber: string;
  generalInfo: GeneralInfoModel;
  itemsList: ListItemModel[];
  linkedToCsl: ConsolidatedTrackingModel;
  linkedToMst: MasterTrackingModel;
  createdAt: Date;
  updatedAt: Date;
}

export interface InPersonTrackingModel { // From backend
  _id: string;
  trackingNumber: string;
  generalInfo: GeneralInfoModel;
  subTrackings: InPersonSubTrackingModel[];
  createdAt: Date;
  updatedAt: Date;
}




