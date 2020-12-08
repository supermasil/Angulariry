import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMaterialModule } from '../angular-material.module';
import { AppRoutingModule } from '../app-routing.module';
import { CodeScannerModule } from '../code-scanner/code-scanner.module';
import { TrackingCreateComponent } from './tracking-create-edit/tracking-create.component';
import { TrackingListComponent } from './tracking-list/tracking-list.component';
import { TrackingToolComponent } from './tracking-tool/tracking-tool.component';
import { NgxCurrencyModule } from 'ngx-currency';
import { onlineFormCreateComponent } from './tracking-create-edit/tracking-forms/online-form.component';
import { servicedFormCreateComponent } from './tracking-create-edit/tracking-forms/serviced-form.component';
import { inPersonFormCreateComponent } from './tracking-create-edit/tracking-forms/in-person-form.component';
import { consolidatedFormCreateComponent } from './tracking-create-edit/tracking-forms/consolidated-form.component';
import { masterFormCreateComponent } from './tracking-create-edit/tracking-forms/master-form.component';


@NgModule({
  declarations: [
    TrackingToolComponent,
    TrackingListComponent,
    TrackingCreateComponent,
    onlineFormCreateComponent,
    servicedFormCreateComponent,
    inPersonFormCreateComponent,
    consolidatedFormCreateComponent,
    masterFormCreateComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    CodeScannerModule,
    NgxCurrencyModule
  ]
})
export class TrackingModule {

}
