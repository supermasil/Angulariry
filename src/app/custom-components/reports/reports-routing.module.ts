import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGlobals } from 'src/app/auth/auth-globals';
import { AuthGuard } from 'src/app/auth/authentication.guard';
import { TrackingsReportComponent } from './trackings-report.component';
import { UsersReportComponent } from './users-report.component';


const routes: Routes = [
  { path: 'trackings', component: TrackingsReportComponent, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.internal}},
  { path: 'users', component: UsersReportComponent, canActivate: [AuthGuard], data: {
    roles: AuthGlobals.internal}}
]

@NgModule({
  imports: [
    RouterModule.forChild(routes) // Lazy loading, will merge with root eventually
  ],
  exports: [RouterModule]
})
export class ReportsRoutingModule{}
