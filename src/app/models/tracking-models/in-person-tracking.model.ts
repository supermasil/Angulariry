import { RecipientModel } from "../recipient.model";
import { GeneralInfoModel } from "./general-info.model";
import { ListItemModel } from "./list-item.model";

export interface InPersonTrackingModel { // From backend
  _id: string;
  trackingNumber: string;
  // sender is customer code
  recipient: RecipientModel;
  generalInfo: GeneralInfoModel;
  itemsList: [ListItemModel];
  createdAt: Date;
  updatedAt: Date;
}




