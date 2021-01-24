import { AddressModel } from "./address.model";

export interface RecipientModel { // From backend
  name: string;
  email: string;
  phoneNumber: string;
  address: AddressModel;
}
