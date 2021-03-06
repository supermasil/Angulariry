export interface PricingDiscountModel {
  userId: string;
  perUnitDiscountUnit: string;
  perUnitDiscountAmount: number;
  extraChargeDiscountUnit: string;
  extraChargeDiscountAmount: number;
}

export interface PricingDestinationModel {
  _id: string;
  name: string;
  pricePerUnit: number;
  extraCharge: number;
  extraChargeUnit: string;
  discounts: PricingDiscountModel[]
}

export interface PricingRouteModel {
  _id: string;
  origin: string;
  destinations: PricingDestinationModel[];
}

export interface PricingItemModel {
  _id: string;
  name: string;
  unit: string;
  routes: PricingRouteModel[];
  content: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

export interface PricingModel { // From backend
  _id: string;
  organization: string;
  items: PricingItemModel[]
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}
