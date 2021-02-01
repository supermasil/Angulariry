import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AngularMaterialModule } from '../angular-material.module';
import { AppRoutingModule } from '../app-routing.module';
import { SearchBarModule } from '../custom-components/search-bar/search-bar.module';
import { FrontPageComponent } from './front-page.component';

@NgModule({
  declarations: [
    FrontPageComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    AppRoutingModule,
    SearchBarModule
  ]
})
export class FrontPageModule {

}
