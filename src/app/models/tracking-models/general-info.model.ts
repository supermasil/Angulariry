import { CommentModel } from '../comment.model';
import { RecipientModel } from '../recipient.model';

export interface GeneralInfoModel { // From backend
  sender: string; // Unique index
  recipient: RecipientModel;
  organizationId: string;
  content: string; // Note
  status: string;
  active: boolean; // This should be false to prevent edit after certain stage
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
