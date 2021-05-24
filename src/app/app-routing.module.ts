import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/authentication.guard';
import { CustomLayoutComponent } from './custom-components/custom-layout/custom-layout.component';
import { QuicklinkModule } from 'ngx-quicklink';

const routes: Routes = [
  { path: "auth",
    loadChildren: () => import("./auth/auth.module")
    .then(module => module.AuthModule)
  },
  {
    path: '',
    component: CustomLayoutComponent,
    children: [
      { path: '',
        loadChildren: () => import("./pages/front-page/front-page.module")
        .then(module => module.FrontPageModule)},
      { path: 'trackings',
        loadChildren: () => import("./trackings/tracking.module")
        .then(module => module.TrackingModule)},
      { path: 'pricings',
        loadChildren: () => import("./pages/pricings/pricing.module")
        .then(module => module.PricingModule)},
      { path: "reports",
        loadChildren: () => import("./custom-components/reports/reports.module")
        .then(module => module.ReportsModule)},
      { path: "aio",
      loadChildren: () => import("./pages/aio-table/aio-table.module")
      .then(module => module.AioTableModule)},
      { path: '**',
        loadChildren: () => import('./pages/errors/error-404/error-404.module')
        .then(m => m.Error404Module)
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
