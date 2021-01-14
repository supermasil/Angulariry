import { AddressModel } from "./address.model";

export interface OrganizationModel { // From backend
  _id: string;
  email: string;
  name: string;
  companyCode: string;
  locations: [{
    name: string;
    phoneNumber: string;
    faxNumber: string;
    address: AddressModel;
    operatingHours: [string]; //hh:mm:ss - hh:mm:ss
    operatingDays: [string]; // Mon, Tues ....
  }];
  insuranceOptions: [string];
  pricings: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}
