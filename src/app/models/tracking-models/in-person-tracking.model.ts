import { RecipientModel } from "../recipient.model";
import { GeneralInfoModel } from "./general-info.model";
import { ListItemModel } from "./list-item.model";

export interface InPersonTrackingModel { // From backend
  _id: string;
  trackingNumber: string;
  generalInfo: GeneralInfoModel;
  itemsList: ListItemModel[];
  linkedTo: string[];
  createdAt: Date;
  updatedAt: Date;
}




