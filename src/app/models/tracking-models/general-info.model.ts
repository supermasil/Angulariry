import { CommentModel } from '../comment.model';
import { RecipientModel } from '../recipient.model';
import { UserModel } from '../user.model';

export interface GeneralInfoModel { // From backend
  sender: UserModel; // Unique index
  recipient: RecipientModel;
  organization: string;
  content: string; // Note
  trackingStatus: string;
  financialStatus: string;
  active: boolean; // This should be false to prevent edit after certain stage
  type: string;

  totalWeight: number; // Can be updated later on
  finalCost: number; // The money to charge customer
  costAdjustment: number;
  exchange: number

  currentLocation: string; //Unknown, Oregon, HN, SG....
  origin: string;
  destination: string;
  shippingOptions: {
    payAtDestination: boolean;
    receiveAtDestination: boolean;
  };

  creatorId: string; // Google id, has to be string
  creatorName: string;

  filePaths: string[];
  comments: CommentModel[];
}
