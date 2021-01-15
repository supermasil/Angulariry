import { AddressModel } from "./address.model";

export interface RecipientModel { // From backend
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: AddressModel;
}
