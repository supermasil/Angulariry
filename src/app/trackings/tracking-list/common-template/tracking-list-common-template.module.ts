import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgxPrintModule } from 'ngx-print';
import { AngularMaterialModule } from 'src/app/angular-material.module';
import { TrackingListCommonTemplateComponent } from './tracking-list-common-template.component';



@NgModule({
  declarations: [
    TrackingListCommonTemplateComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule.forChild(),
    NgxPrintModule,
    RouterModule
  ], exports: [
    TrackingListCommonTemplateComponent
  ]
})
export class TrackingListCommonTemplateModule {

}
