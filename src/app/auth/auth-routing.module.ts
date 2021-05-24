import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGlobals } from './auth-globals';
import { AdjustCreditFormComponent } from './auth-forms/adjust-credit.component';
import { EditUserFormComponent } from './auth-forms/edit-user.component';
import { LoginFormComponent } from './auth-forms/login.component';
import { OrgOnboardingFormComponentForm } from './auth-forms/org-onboarding.component';
import { SignUpFormComponent } from './auth-forms/signup.component';
import { AuthGuard } from './authentication.guard';
import { PasswordResetFormComponent } from './auth-forms/password-reset.component';


const routes: Routes = [
  { path: '', component: LoginFormComponent},
  { path: "register", component: SignUpFormComponent},
  { path: "forgot-password", component: PasswordResetFormComponent},
  { path: "users", component: EditUserFormComponent, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.internal}},
  { path: "users/edit/:userId", component: SignUpFormComponent, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.everyone}},
  { path: "users/adjustCredit", component: AdjustCreditFormComponent, canActivate: [AuthGuard], data: {
    roles: [...AuthGlobals.managerAdmins, AuthGlobals.roles.Accounting]}},
  { path: "users/new", component: SignUpFormComponent, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.internal}},
  { path: "orgs/edit/:orgId", component: OrgOnboardingFormComponentForm, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.admins}},
  { path: "orgs/new", component: OrgOnboardingFormComponentForm, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.roles.SuperAdmin}},
]

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class AuthRoutingModule{}
