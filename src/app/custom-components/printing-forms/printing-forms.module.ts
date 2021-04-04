import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NgxQRCodeModule } from '@techiediaries/ngx-qrcode';
import { NgxBarcodeModule } from 'ngx-barcode';
import { AngularMaterialModule } from 'src/app/angular-material.module';
import { GeneralInfoPrintComponent } from './general-info-print.component';


@NgModule({
  declarations: [
    GeneralInfoPrintComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    NgxQRCodeModule,
    NgxBarcodeModule,
    TranslateModule.forChild()
  ],
  exports: [
    GeneralInfoPrintComponent
  ]
})
export class PrintFormsModule {

}
