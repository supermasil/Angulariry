import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/authentication.guard';
import { Component404 } from './front-page/404/404.component';
import { FrontPageComponent } from './front-page/front-page.component';
import { TrackingToolComponent } from './trackings/tracking-tool/tracking-tool.component';
import { TrackingCreateEditComponent } from './trackings/tracking-create-edit/tracking-create-edit.component';
import { TrackingListComponent } from './trackings/tracking-list/tracking-list.component';
import { AuthGlobals } from './auth/auth-globals';

const routes: Routes = [
  { path: '', component: FrontPageComponent, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.everyone}},
  { path: 'trackings', component: TrackingListComponent, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.everyone}},
  { path: 'trackings/create', loadChildren: () => import("./trackings/tracking.module").then(module => module.TrackingModule), canActivate: [AuthGuard], data: {
    roles: AuthGlobals.everyone}},
  { path: 'trackings/edit/:trackingId', component: TrackingCreateEditComponent, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.everyone}},
  { path: 'trackings/tracking-tool', component: TrackingToolComponent, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.everyone}},
  { path: 'pricings', loadChildren: () => import("./custom-components/pricings/pricing.module").then(module => module.PricingModule), canActivate: [AuthGuard], data: {
    roles: [AuthGlobals.roles.SuperAdmin, AuthGlobals.roles.Admin, AuthGlobals.roles.Manager]}},
  { path: "auth", loadChildren: () => import("./auth/auth.module").then(module => module.AuthModule)}, // Lazy loading
  { path: "auth/users/edit/:userId", loadChildren: () => import("./auth/auth.module").then(module => module.AuthModule), canActivate: [AuthGuard], data: {
    roles: AuthGlobals.everyone}}, // Lazy loading
  { path: "auth/organizations/edit/:orgId", loadChildren: () => import("./auth/auth.module").then(module => module.AuthModule), canActivate: [AuthGuard], data: {
    roles: [AuthGlobals.roles.SuperAdmin, AuthGlobals.roles.Admin]}}, // Lazy loading
  { path: "404", component: Component404},
  { path: "**", component: Component404} // Must be last
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthGuard]
})

export class AppRoutingModule {};
