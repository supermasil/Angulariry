import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGlobals } from './auth-globals';
import { AdjustCreditFormComponent } from './auth-components/adjust-credit.component';
import { EditUserFormComponent } from './auth-components/edit-user.component';
import { LoginFormComponent } from './auth-components/login.component';
import { OnboardingFormComponentForm } from './auth-components/onboarding.component';
import { SignUpFormComponent } from './auth-components/signup.component';
import { AuthGuard } from './authentication.guard';


const routes: Routes = [
  { path: '', component: LoginFormComponent},
  { path: "users/edit/:userId", component: SignUpFormComponent, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.everyone}}, // Lazy loading
  { path: "users/edit", component: EditUserFormComponent, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.internal}}, // Lazy loading
  { path: "users/adjustCredit", component: AdjustCreditFormComponent, canActivate: [AuthGuard], data: {
    roles: [...AuthGlobals.managerAdmins, AuthGlobals.roles.Accounting]}}, // Lazy loading
  { path: "users/new", component: SignUpFormComponent, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.internal}}, // Lazy loading
  { path: "orgs/edit/:orgId", component: OnboardingFormComponentForm, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.admins}}, // Lazy loading
  { path: "orgs/new", component: OnboardingFormComponentForm, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.roles.SuperAdmin}}, // Lazy loading
]

@NgModule({
  imports: [
    RouterModule.forChild(routes) // Lazy loading, will merge with root eventually
  ],
  exports: [RouterModule]
})
export class AuthRoutingModule{}
