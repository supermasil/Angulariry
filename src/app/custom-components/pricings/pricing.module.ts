import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMaterialModule } from '../../angular-material.module';
import { NgxCurrencyModule } from 'ngx-currency';
import { PricingRoutingModule } from './pricing-routing.module';
import { DirectiveModule } from '../directives/directives.module';
import { TranslateModule } from '@ngx-translate/core';
import { AutoCompleteInputModule } from '../auto-complete-input/auto-complete-input.module';
import { NewPricingComponent } from './pricings-components/new-pricing.component';
import { EditPricingComponent } from './pricings-components/edit-pricing.component';
import { PricingCommonComponent } from './pricings-components/pricing-common.component';
import { CustomPricingComponent } from './pricings-components/custom-pricing.component';
import { SaveCancelButtonsModule } from '../save-cancel-buttons/save-cancel-buttons.module';


@NgModule({
  declarations: [
    NewPricingComponent,
    EditPricingComponent,
    PricingCommonComponent,
    CustomPricingComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    AutoCompleteInputModule,
    ReactiveFormsModule,
    NgxCurrencyModule,
    PricingRoutingModule,
    DirectiveModule,
    TranslateModule.forChild(),
    SaveCancelButtonsModule
  ]
})
export class PricingModule {
}
