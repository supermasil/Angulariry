import { AddressModel } from "./address.model";
import { OrganizationModel } from "./organization.model";
import { RecipientModel } from "./recipient.model";

export interface UserModel { // From backend
  _id: string;
  name: string;
  email: string; // unique doesn't not throw error if not unique
  phoneNumber: string;
  role: string;
  defaultLocation: string;// Oregon, California...
  recipients: [RecipientModel];
  addresses: [AddressModel];
  companyCode: string;
  customerCode: string;
  organization: string;
  pricings: string;
  active: boolean;
  credit: number;
  createdAt: Date;
  updatedAt: Date;
}
