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
import { OnlineFormCreateComponent } from './tracking-create-edit/tracking-forms/online-form.component';
import { ServicedFormCreateComponent } from './tracking-create-edit/tracking-forms/serviced-form.component';
import { InPersonFormCreateComponent } from './tracking-create-edit/tracking-forms/in-person-form.component';
import { ConsolidatedFormCreateComponent } from './tracking-create-edit/tracking-forms/consolidated-form.component';
import { MasterFormCreateComponent } from './tracking-create-edit/tracking-forms/master-form.component';
import { ItemsListComponent } from './tracking-create-edit/items-list/items-list.component';
import { FileUploaderModule } from '../file-uploader/file-uploader.module';


@NgModule({
  declarations: [
    TrackingToolComponent,
    TrackingListComponent,
    TrackingCreateComponent,
    OnlineFormCreateComponent,
    ServicedFormCreateComponent,
    InPersonFormCreateComponent,
    ConsolidatedFormCreateComponent,
    MasterFormCreateComponent,
    ItemsListComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    CodeScannerModule,
    NgxCurrencyModule,
    FileUploaderModule
  ]
})
export class TrackingModule {

}
