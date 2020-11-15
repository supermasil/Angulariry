export interface Tracking { // From backend
  _id: string
  trackingNumber: string;
  status: string;
  carrier: string;
  imagePath: string;
  creator: string;
  trackerId: string;
  content: string;
  active: boolean;
  timeline: [{
    user: string,
    action: string,
    timestamp: Date
  }],
  createdAt: Date;
  updatedAt: Date;
}
