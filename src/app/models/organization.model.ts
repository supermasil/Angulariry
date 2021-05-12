import { AddressModel } from "./address.model";

export interface OrganizationModel { // From backend
  _id: string;
  email: string;
  name: string;
  registerCode: string;
  locations: [OrganizationLocationModel];
  insuranceOptions: string[];
  pricings: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

export interface OrganizationLocationModel {
  name: string;
  phoneNumber: string;
  faxNumber: string;
  address: AddressModel;
  operatingHours: string[]; //hh:mm:ss - hh:mm:ss
  operatingDays: string[]; // Mon, Tues ....
}
