import { CarrierTrackingModel } from "./carrier-tracking.model";
import { GeneralInfoModel } from "./general-info.model";
import { ListItemModel } from "./list-item.model";

export interface OnlineTrackingModel { // From backend
  _id: string;
  trackingNumber: string;
  carrierTracking: CarrierTrackingModel;
  generalInfo: GeneralInfoModel;
  itemsList: ListItemModel[];
  linkedTo: string[];
  createdAt: Date;
  updatedAt: Date;
}




