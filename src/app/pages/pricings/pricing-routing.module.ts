import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGlobals } from 'src/app/auth/auth-globals';
import { AuthGuard } from 'src/app/auth/authentication.guard';
import { CustomPricingComponent } from './pricings-components/custom-pricing.component';
import { EditPricingComponent } from './pricings-components/edit-pricing.component';
import { NewPricingComponent } from './pricings-components/new-pricing.component';


const routes: Routes = [
  { path: 'new', component: NewPricingComponent, canActivate: [AuthGuard], data: {
    roles: [AuthGlobals.roles.SuperAdmin, AuthGlobals.roles.Admin, AuthGlobals.roles.Manager]}},
  { path: 'edit', component: EditPricingComponent, canActivate: [AuthGuard], data: {
    roles: [AuthGlobals.roles.SuperAdmin, AuthGlobals.roles.Admin, AuthGlobals.roles.Manager]}},
  { path: 'custom', component: CustomPricingComponent, canActivate: [AuthGuard], data: {
    roles: [AuthGlobals.roles.SuperAdmin, AuthGlobals.roles.Admin, AuthGlobals.roles.Manager]}},
]

@NgModule({
  imports: [
    RouterModule.forChild(routes) // Lazy loading, will merge with root eventually
  ],
  exports: [RouterModule]
})
export class PricingRoutingModule{}
