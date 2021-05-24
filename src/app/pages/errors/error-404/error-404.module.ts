import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Error404RoutingModule } from './error-404-routing.module';
import { Error404Component } from './error-404.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { IconModule } from '@visurel/iconify-angular';
import { AngularMaterialModule } from 'src/app/angular-material.module';


@NgModule({
  declarations: [Error404Component],
  imports: [
    CommonModule,
    Error404RoutingModule,
    FlexLayoutModule,
    IconModule,
    AngularMaterialModule
  ]
})
export class Error404Module {
}
