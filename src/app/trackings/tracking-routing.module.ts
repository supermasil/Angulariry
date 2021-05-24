import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGlobals } from '../auth/auth-globals';
import { AuthGuard } from '../auth/authentication.guard';
import { FrontPageComponent } from '../pages/front-page/front-page.component';
import { ConsolidatedTrackingFormComponent } from './tracking-create-edit/tracking-forms/consolidated-form.component';
import { InPersonTrackingFormComponent } from './tracking-create-edit/tracking-forms/in-person-form.component';
import { MasterTrackingFormComponent } from './tracking-create-edit/tracking-forms/master-form.component';
import { OnlineTrackingFormComponent } from './tracking-create-edit/tracking-forms/online-form.component';
import { ServicedTrackingFormComponent } from './tracking-create-edit/tracking-forms/serviced-form.component';
import { TrackingListComponent } from './tracking-list/tracking-list.component';
import { TrackingToolComponent } from './tracking-tool/tracking-tool.component';



const routes: Routes = [
  { path: '', redirectTo: '/trackings/onl', pathMatch: 'full', component: TrackingListComponent, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.everyone}},
  { path: ':type', component: TrackingListComponent, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.everyone}},
  { path: 'tracking-tool', component: TrackingToolComponent, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.internal}},
  { path: 'create/onl', component: OnlineTrackingFormComponent, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.everyone}},
  { path: 'create/sev', component: ServicedTrackingFormComponent, canActivate: [AuthGuard], data: {
  roles: AuthGlobals.internal}},
  { path: 'create/inp', component: InPersonTrackingFormComponent, canActivate: [AuthGuard], data: {
  roles: AuthGlobals.internal}},
  { path: 'create/csl', component: ConsolidatedTrackingFormComponent, canActivate: [AuthGuard], data: {
  roles: AuthGlobals.internal}},
  { path: 'create/mst', component: MasterTrackingFormComponent, canActivate: [AuthGuard], data: {
  roles: AuthGlobals.internal}},
  { path: 'edit/onl/:trackingId', component: OnlineTrackingFormComponent, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.everyone}},
  { path: 'edit/sev/:trackingId', component: ServicedTrackingFormComponent, canActivate: [AuthGuard], data: {
  roles: AuthGlobals.internal}},
  { path: 'edit/inp/:trackingId', component: InPersonTrackingFormComponent, canActivate: [AuthGuard], data: {
  roles: AuthGlobals.internal}},
  { path: 'edit/csl/:trackingId', component: ConsolidatedTrackingFormComponent, canActivate: [AuthGuard], data: {
  roles: AuthGlobals.internal}},
  { path: 'edit/mst/:trackingId', component: MasterTrackingFormComponent, canActivate: [AuthGuard], data: {
  roles: AuthGlobals.internal}},
  { path: 'view/:trackingId', component: FrontPageComponent, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.everyone}}
]

@NgModule({
  imports: [
    RouterModule.forChild(routes) // Lazy loading, will merge with root eventually
  ],
  exports: [RouterModule]
})
export class TrackingRoutingModule{}
