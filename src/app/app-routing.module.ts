import { NgModule } from '@angular/core';
import { RouterModule, Routes, Router } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { Component404 } from './404/404.component';
import { FrontPageComponent } from './front-page/front-page.component';
import { TrackingToolComponent } from './trackings/tracking-tool/tracking-tool.component';
import { TrackingCreateComponent } from './trackings/tracking-create-edit/tracking-create.component';
import { TrackingListComponent } from './trackings/tracking-list/tracking-list.component';

const routes: Routes = [
  { path: '', component: FrontPageComponent},
  { path: 'trackings', component: TrackingListComponent},
  { path: 'create', component: TrackingCreateComponent, canActivate: [AuthGuard]},
  { path: 'edit/:trackingId', component: TrackingCreateComponent, canActivate: [AuthGuard]},
  { path: 'trackings/tracking-tool', component: TrackingToolComponent, canActivate: [AuthGuard]},
  { path: "auth", loadChildren: () => import("./auth/auth.module").then(module => module.AuthModule)}, // Lazy loading
  { path: "404", component: Component404},
  { path: "**", component: Component404} // Must be last
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthGuard]
})

export class AppRoutingModule {};
