import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AngularMaterialModule } from '../../../angular-material.module';
import { AutoCompleteInputModule } from '../../../custom-components/auto-complete-input/auto-complete-input.module';
import { OnboardingComponent } from './onboarding.component';

@NgModule({
  declarations: [
    OnboardingComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    AutoCompleteInputModule,
  ], exports: [
    OnboardingComponent
  ]
})
export class OnboardingModule {

}
