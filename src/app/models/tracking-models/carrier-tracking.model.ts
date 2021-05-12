export interface CarrierTrackingModel {
  _id: string;
  carrierTrackingNumber: string; //USPS tracking numbers can be recycled, let's hope it's not often
  status: string;
  trackerId: string; // Tracker Object id, optional // Use for easy post to update status
  carrier: string;
  postId: string; // sev-123213 mst123452 // this is supposed to be general
  createdAt: Date;
  updatedAt: Date;
}
