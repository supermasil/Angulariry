import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AngularMaterialModule } from '../angular-material.module';
import { FrontPageRoutingModule } from './front-page-routing.module';
import { FrontPageComponent } from './front-page.component';

@NgModule({
  declarations: [
    FrontPageComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    FrontPageRoutingModule,
    TranslateModule.forChild()
  ]
})
export class FrontPageModule {

}
