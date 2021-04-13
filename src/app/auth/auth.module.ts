import { NgModule } from '@angular/core';
import { AngularMaterialModule } from '../angular-material.module';
import { CommonModule } from '@angular/common';
import { AuthRoutingModule } from './auth-routing.module';
import { LacMatTelInputModule } from 'lac-mat-tel-input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { GooglePlaceModule } from "ngx-google-places-autocomplete";
import { LoginFormComponent } from './auth-forms/login.component';
import { PasswordResetFormComponent } from './auth-forms/password-reset.component';
import { SignUpFormComponent } from './auth-forms/signup.component';
import { OnboardingFormComponentForm } from './auth-forms/onboarding.component';
import { AutoCompleteInputModule } from '../custom-components/auto-complete-input/auto-complete-input.module';
import { EditUserFormComponent } from './auth-forms/edit-user.component';
import { AdjustCreditFormComponent } from './auth-forms/adjust-credit.component';
import { NgxCurrencyModule } from 'ngx-currency';
import { TranslateModule } from '@ngx-translate/core';
import { UserListCommonModule } from './user-list-common/user-list-common.module';

@NgModule({
  declarations: [
    LoginFormComponent,
    PasswordResetFormComponent,
    SignUpFormComponent,
    OnboardingFormComponentForm,
    EditUserFormComponent,
    AdjustCreditFormComponent
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
    AutoCompleteInputModule,
    NgxCurrencyModule,
    TranslateModule.forChild(),
    UserListCommonModule
  ]
})
export class AuthModule {}
