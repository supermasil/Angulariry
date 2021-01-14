import { CommentModel } from '../comment.model';

export interface GeneralInfoModel { // From backend
  customerCode: string; // Unique index
  organizationId: string;
  content: string; // Note
  status: string;
  active: boolean; // This should be false to prevent edit after certain stage
  type: string; // Online Order...
  weight: number; // Can be updated later on
  finalCost: number; // The money to charge customer

  currentLocation: string; //Unknown, Oregon, HN, SG....
  origin: string;
  destination: string;
  shippingOptions: {
    payAtDestination: boolean;
    receiveAtDestination: boolean;
  };

  creatorId: string; // Google id, has to be string
  creatorName: string;

  filePaths: [{type: String}];
  comments: [CommentModel];
}
