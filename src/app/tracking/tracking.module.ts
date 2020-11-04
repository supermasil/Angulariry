import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AngularMaterialModule } from '../angular-material.module';
import { AppRoutingModule } from '../app-routing.module';
import { TrackingComponent } from './tracking.component';

@NgModule({
  declarations: [
    TrackingComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    AppRoutingModule,
    ReactiveFormsModule
  ]
})
export class TrackingModule {

}
