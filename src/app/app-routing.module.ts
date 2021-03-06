import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/authentication.guard';
import { TrackingToolComponent } from './trackings/tracking-tool/tracking-tool.component';
import { TrackingCreateEditComponent } from './trackings/tracking-create-edit/tracking-create-edit.component';
import { TrackingListComponent } from './trackings/tracking-list/tracking-list.component';
import { AuthGlobals } from './auth/auth-globals';
import { Component404 } from './front-page/404/404.component';

const routes: Routes = [
  { path: '', loadChildren: () => import("./front-page/front-page.module").then(module => module.FrontPageModule), canActivate: [AuthGuard], data: {
    roles: AuthGlobals.everyone}},
  { path: 'trackings/tracking-tool', component: TrackingToolComponent, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.internal}},
  { path: 'trackings/:type', component: TrackingListComponent, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.everyone}},
  { path: 'trackings', component: TrackingListComponent, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.everyone}},
  { path: 'trackings/create/:type', loadChildren: () => import("./trackings/tracking.module").then(module => module.TrackingModule), canActivate: [AuthGuard], data: {
    roles: AuthGlobals.everyone}},
  { path: 'trackings/edit/:trackingId', component: TrackingCreateEditComponent, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.everyone}},
  { path: 'pricing/:type', loadChildren: () => import("./custom-components/pricings/pricing.module").then(module => module.PricingModule), canActivate: [AuthGuard], data: {
    roles: [AuthGlobals.roles.SuperAdmin, AuthGlobals.roles.Admin, AuthGlobals.roles.Manager]}},

  { path: "auth/users/edit/:userId", loadChildren: () => import("./auth/auth.module").then(module => module.AuthModule), canActivate: [AuthGuard], data: {
    roles: AuthGlobals.everyone}}, // Lazy loading
  { path: "auth/users/edit", loadChildren: () => import("./auth/auth.module").then(module => module.AuthModule), canActivate: [AuthGuard], data: {
    roles: AuthGlobals.internal}}, // Lazy loading
  { path: "auth/users/new", loadChildren: () => import("./auth/auth.module").then(module => module.AuthModule), canActivate: [AuthGuard], data: {
    roles: AuthGlobals.internal}}, // Lazy loading
  { path: "auth/orgs/edit/:orgId", loadChildren: () => import("./auth/auth.module").then(module => module.AuthModule), canActivate: [AuthGuard], data: {
    roles: AuthGlobals.admins}}, // Lazy loading
  { path: "auth/orgs/new", loadChildren: () => import("./auth/auth.module").then(module => module.AuthModule), canActivate: [AuthGuard], data: {
    roles: AuthGlobals.roles.SuperAdmin}}, // Lazy loading
  { path: "auth", loadChildren: () => import("./auth/auth.module").then(module => module.AuthModule)}, // Lazy loading
  { path: "404", component: Component404, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.everyone}},
  { path: "**", component: Component404, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.everyone}} // Must be last
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthGuard]
})

export class AppRoutingModule {};
