import { AddressModel } from "./address.model";
import { OrganizationModel } from "./organization.model";
import { RecipientModel } from "./recipient.model";

export interface UserModel { // From backend
  _id: string;
  id: string; // Firebase uuid
  name: string;
  email: string; // unique doesn't not throw error if not unique
  phoneNumber: string;
  pricings: string;
  recipients: RecipientModel[];
  addresses: AddressModel[];
  userCode: string;
  organization: OrganizationModel;
  organizations: [{
    organization: string;
    role: string;
    active: boolean;
    credit: number;
    creatorId: string;
    creditHistory: string[];
  }];
  role: string;
  creatorId: string;
  active: boolean;
  credit: number;
  creditHistory: string[];
  createdAt: Date;
  updatedAt: Date;
}
