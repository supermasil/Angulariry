import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMaterialModule } from '../angular-material.module';
import { NgxCurrencyModule } from 'ngx-currency';
import { AutoCompleteInputModule } from '../custom-components/auto-complete-input/auto-complete-input.module';
import { PricingComponent } from './pricing.component';
import { PricingRoutingModule } from './pricing-routing.module';
import { DirectiveModule } from '../directives/directives.module';


@NgModule({
  declarations: [
    PricingComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    NgxCurrencyModule,
    AutoCompleteInputModule,
    PricingRoutingModule,
    DirectiveModule
  ]
})
export class PricingModule {
}
