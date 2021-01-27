import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { Component404 } from './404/404.component';
import { FrontPageComponent } from './front-page/front-page.component';
import { TrackingToolComponent } from './trackings/tracking-tool/tracking-tool.component';
import { TrackingCreateEditComponent } from './trackings/tracking-create-edit/tracking-create-edit.component';
import { TrackingListComponent } from './trackings/tracking-list/tracking-list.component';

const routes: Routes = [
  { path: '', component: FrontPageComponent},
  { path: 'trackings/create', loadChildren: () => import("./trackings/tracking.module").then(module => module.TrackingModule), canActivate: [AuthGuard]},
  { path: 'trackings', component: TrackingListComponent},
  { path: 'trackings/edit/:trackingId', component: TrackingCreateEditComponent, canActivate: [AuthGuard]},
  { path: 'trackings/tracking-tool', component: TrackingToolComponent, canActivate: [AuthGuard]},
  { path: 'pricings', loadChildren: () => import("./pricings/pricing.module").then(module => module.PricingModule)},
  { path: "auth", loadChildren: () => import("./auth/auth.module").then(module => module.AuthModule)}, // Lazy loading
  { path: "auth/users/edit/:userId", loadChildren: () => import("./auth/auth.module").then(module => module.AuthModule), canActivate: [AuthGuard]}, // Lazy loading
  { path: "auth/organizations/edit/:orgId", loadChildren: () => import("./auth/auth.module").then(module => module.AuthModule), canActivate: [AuthGuard]}, // Lazy loading
  { path: "404", component: Component404},
  { path: "**", component: Component404} // Must be last
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthGuard]
})

export class AppRoutingModule {};
