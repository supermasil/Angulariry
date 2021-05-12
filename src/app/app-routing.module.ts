import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/authentication.guard';
import { AuthGlobals } from './auth/auth-globals';
import { Component404 } from './front-page/404/404.component';
import { CustomLayoutComponent } from './custom-layout/custom-layout.component';
import { QuicklinkModule } from 'ngx-quicklink';

const routes: Routes = [
  {
    path: '',
    component: CustomLayoutComponent,
    children: [
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
      { path: '**',
        loadChildren: () => import('./pages/errors/error-404/error-404.module').then(m => m.Error404Module)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'enabled',
    relativeLinkResolution: 'corrected',
    anchorScrolling: 'enabled'
  })],
  exports: [RouterModule, QuicklinkModule],
  providers: [AuthGuard]
})

export class AppRoutingModule {};
