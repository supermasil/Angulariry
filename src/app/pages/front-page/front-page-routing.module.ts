import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGlobals } from '../../auth/auth-globals';
import { AuthGuard } from '../../auth/authentication.guard';
import { FrontPageComponent } from './front-page.component';



const routes: Routes = [
  { path: '', component: FrontPageComponent, canActivate: [AuthGuard], data: {roles: AuthGlobals.everyone}}
]

@NgModule({
  imports: [
    RouterModule.forChild(routes) // Lazy loading, will merge with root eventually
  ],
  exports: [RouterModule]
})
export class FrontPageRoutingModule{}
