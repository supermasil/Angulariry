import { Comment } from '../comments/comment.model';

export interface Tracking { // From backend
  _id: string;
  trackingNumber: string;
  status: string;
  carrier: string;
  filePaths: [string];
  creatorId: string;
  trackerId: string;
  content: string;
  active: boolean;
  timeline: [{
    userId: string,
    action: string,
    timestamp: Date
  }];
  comments: [Comment];
  createdAt: Date;
  updatedAt: Date;
}
