import { CarrierTrackingModel } from "./carrier-tracking.model";
import { ConsolidatedTrackingModel } from "./consolidated-tracking.model";
import { GeneralInfoModel } from "./general-info.model";
import { ListItemModel } from "./list-item.model";
import { MasterTrackingModel } from "./master-tracking.model";

export interface ServicedTrackingModel { // From backend
  _id: string;
  trackingNumber: string;
  requestedItems: [{
    link: string;
    declaredValue: number;
    specifications: string;
    quantity: number;
    orderNumbers: string[]; // A link can have multiple order numbers
    carrierTrackings: [CarrierTrackingModel];
  }];
  generalInfo: GeneralInfoModel;
  itemsList: ListItemModel[];
  linkedToCsl: ConsolidatedTrackingModel;
  linkedToMst: MasterTrackingModel;
  createdAt: Date;
  updatedAt: Date;
}




