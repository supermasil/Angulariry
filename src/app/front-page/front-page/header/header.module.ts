import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AngularMaterialModule } from '../../../angular-material.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { HeaderComponent } from './header.component';

@NgModule({
  declarations: [
    HeaderComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    OnboardingModule
  ], exports: [
    HeaderComponent
  ]
})
export class HeaderModule {

}
