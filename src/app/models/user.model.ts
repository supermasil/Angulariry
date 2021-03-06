import { AddressModel } from "./address.model";
import { OrganizationModel } from "./organization.model";
import { RecipientModel } from "./recipient.model";

export interface UserModel { // From backend
  _id: string;
  name: string;
  email: string; // unique doesn't not throw error if not unique
  phoneNumber: string;
  role: string;
  recipients: RecipientModel[];
  addresses: AddressModel[];
  userCode: string;
  organization: OrganizationModel;
  organizations: [{
    organization: string;
    role: string;
  }];
  pricings: string;
  creatorId: string;
  active: boolean;
  credit: number;
  createdAt: Date;
  updatedAt: Date;
}
