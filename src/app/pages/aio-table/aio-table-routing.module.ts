import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { QuicklinkModule } from 'ngx-quicklink';
import { AuthGlobals } from 'src/app/auth/auth-globals';
import { AuthGuard } from 'src/app/auth/authentication.guard';
import { VexRoutes } from '../../../@vex/interfaces/vex-route.interface';
import { AioTableComponent } from './aio-table.component';


const routes: VexRoutes = [
  {
    path: '',
    component: AioTableComponent,
    canActivate: [AuthGuard],
    data: {
      roles: AuthGlobals.internal,
      toolbarShadowEnabled: true
    } 
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule, QuicklinkModule]
})
export class AioTableRoutingModule {
}
