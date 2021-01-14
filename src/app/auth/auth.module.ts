import { NgModule } from '@angular/core';
import { AngularMaterialModule } from '../angular-material.module';
import { CommonModule } from '@angular/common';
import { AuthRoutingModule } from './auth-routing.module';
import { AuthComponent } from './auth/auth.component';
import { LacMatTelInputModule } from 'lac-mat-tel-input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { GooglePlaceModule } from "ngx-google-places-autocomplete";
import { LoginFormComponent } from './auth/auth-forms/login.component';
import { PasswordResetFormComponent } from './auth/auth-forms/password-reset.component';
import { SignUpFormComponent } from './auth/auth-forms/signup.component';
import { OnboardingFormComponent } from './auth/auth-forms/onboarding.component';
import { AutoCompleteInputModule } from '../custom-components/auto-complete-input/auto-complete-input.module';

@NgModule({
  declarations: [
    AuthComponent,
    LoginFormComponent,
    PasswordResetFormComponent,
    SignUpFormComponent,
    OnboardingFormComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    ReactiveFormsModule,
    AuthRoutingModule,
    MatFormFieldModule,
    MatButtonModule,
    LacMatTelInputModule,
    GooglePlaceModule,
    AutoCompleteInputModule
  ]
})
export class AuthModule {}
