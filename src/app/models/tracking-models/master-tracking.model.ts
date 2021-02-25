import { GeneralInfoModel } from "./general-info.model";
import { InPersonSubTrackingModel } from "./in-person-tracking.model";
import { OnlineTrackingModel } from "./online-tracking.model";
import { ServicedTrackingModel } from "./serviced-tracking.model";

export interface MasterTrackingBox {
  boxNumber: number;
  palletNumber: number;
  onlineTrackings: OnlineTrackingModel[];
  servicedTrackings: ServicedTrackingModel[];
  inPersonSubTrackings: InPersonSubTrackingModel[];
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




