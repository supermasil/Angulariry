import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMaterialModule } from '../angular-material.module';
import { CodeScannerModule } from '../code-scanner/code-scanner.module';
import { TrackingListComponent } from './tracking-list/tracking-list.component';
import { TrackingToolComponent } from './tracking-tool/tracking-tool.component';
import { NgxCurrencyModule } from 'ngx-currency';
import { OnlineFormCreateComponent } from './tracking-create-edit/tracking-forms/online.component';
import { ServicedFormCreateComponent } from './tracking-create-edit/tracking-forms/serviced.component';
import { InPersonFormCreateComponent } from './tracking-create-edit/tracking-forms/in-person.component';
import { ConsolidatedFormCreateComponent } from './tracking-create-edit/tracking-forms/consolidated.component';
import { MasterFormCreateComponent } from './tracking-create-edit/tracking-forms/master.component';
import { ItemsListComponent } from './tracking-create-edit/items-list/items-list.component';
import { FileUploaderModule } from '../file-uploader/file-uploader.module';
import { AutoCompleteInputModule } from '../custom-components/auto-complete-input/auto-complete-input.module';
import { TrackingRoutingModule } from './tracking-routing.module';
import { TrackingCreateEditComponent } from './tracking-create-edit/tracking-create-edit.component';
import { GeneralInfoComponent } from './tracking-create-edit/general-info/general-info.component';
import { FinalizedInfoComponent } from './tracking-create-edit/finalized-info/finalized-info.component';
import { NgxPrintModule } from 'ngx-print';


@NgModule({
  declarations: [
    TrackingToolComponent,
    TrackingListComponent,
    TrackingCreateEditComponent,
    OnlineFormCreateComponent,
    ServicedFormCreateComponent,
    InPersonFormCreateComponent,
    ConsolidatedFormCreateComponent,
    MasterFormCreateComponent,
    ItemsListComponent,
    GeneralInfoComponent,
    FinalizedInfoComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CodeScannerModule,
    NgxCurrencyModule,
    FileUploaderModule,
    AutoCompleteInputModule,
    TrackingRoutingModule,
    NgxPrintModule
  ]
})
export class TrackingModule {

}
