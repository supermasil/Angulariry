import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgxQRCodeModule } from '@techiediaries/ngx-qrcode';
import { NgxBarcodeModule } from 'ngx-barcode';
import { NgxPrintModule } from 'ngx-print';
import { AngularMaterialModule } from 'src/app/angular-material.module';
import { PrintFormsModule } from 'src/app/custom-components/printing-forms/printing-forms.module';
import { TrackingListCommonComponent } from './tracking-list-common.component';
import { TrackingListItemsCommonComponent } from './tracking-list-items-common.component';



@NgModule({
  declarations: [
    TrackingListCommonComponent,
    TrackingListItemsCommonComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule.forChild(),
    NgxPrintModule,
    RouterModule,
    PrintFormsModule,
    NgxQRCodeModule,
    NgxBarcodeModule
  ], exports: [
    TrackingListCommonComponent
  ]
})
export class TrackingListCommonModule {

}
