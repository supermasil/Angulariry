import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/authentication.guard';
import { AuthGlobals } from './auth/auth-globals';
import { Component404 } from './front-page/404/404.component';

const routes: Routes = [
  { path: '',
    loadChildren: () => import("./front-page/front-page.module")
    .then(module => module.FrontPageModule),
    canActivate: [AuthGuard], data: {roles: AuthGlobals.everyone}},
  { path: 'trackings',
    loadChildren: () => import("./trackings/tracking.module")
    .then(module => module.TrackingModule)},
  { path: 'pricings',
    loadChildren: () => import("./custom-components/pricings/pricing.module")
    .then(module => module.PricingModule)},
  { path: "auth",
    loadChildren: () => import("./auth/auth.module")
    .then(module => module.AuthModule)},
  { path: "reports",
    loadChildren: () => import("./custom-components/reports/reports.module")
    .then(module => module.ReportsModule)},
  { path: "404", component: Component404,
    canActivate: [AuthGuard], data: {roles: AuthGlobals.everyone}},
  { path: "**", component: Component404,
    canActivate: [AuthGuard], data: {roles: AuthGlobals.everyone}} // Must be last
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthGuard]
})

export class AppRoutingModule {};
