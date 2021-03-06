import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AngularMaterialModule } from '../angular-material.module';
import { AppRoutingModule } from '../app-routing.module';
import { AutoCompleteInputModule } from '../custom-components/auto-complete-input/auto-complete-input.module';
import { SearchBarModule } from '../custom-components/search-bar/search-bar.module';
import { FrontPageRoutingModule } from './front-page-routing.module';
import { FrontPageComponent } from './front-page.component';

@NgModule({
  declarations: [
    FrontPageComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    SearchBarModule,
    AutoCompleteInputModule,
    FrontPageRoutingModule
  ]
})
export class FrontPageModule {

}
