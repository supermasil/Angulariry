import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { QuicklinkModule } from 'ngx-quicklink';
import { VexRoutes } from 'src/@vex/interfaces/vex-route.interface';
import { Error404Component } from './error-404.component';



const routes: VexRoutes = [
  {
    path: '',
    component: Error404Component,
    data: {
      containerEnabled: true,
      toolbarShadowEnabled: true
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule, QuicklinkModule]
})
export class Error404RoutingModule {
}
