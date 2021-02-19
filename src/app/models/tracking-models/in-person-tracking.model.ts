import { ConsolidatedTrackingModel } from "./consolidated-tracking.model";
import { GeneralInfoModel } from "./general-info.model";
import { ListItemModel } from "./list-item.model";
import { MasterTrackingModel } from "./master-tracking.model";

export interface InPersonSubTrackingModel {
  _id: string;
  trackingNumber: string;
  itemsList: ListItemModel[];
  linkedToCsl: ConsolidatedTrackingModel;
  linkedToMst: MasterTrackingModel;
  generalInfo: {
    totalWeight: number; // Can be updated later on
    finalCost: number; // The money to charge customer
    costAdjustment: number;
    exchange: number;
    paid: boolean;
    status: string;
  }
}

export interface InPersonTrackingModel { // From backend
  _id: string;
  trackingNumber: string;
  generalInfo: GeneralInfoModel;
  subTrackings: InPersonSubTrackingModel[];
  createdAt: Date;
  updatedAt: Date;
}




