import { NgModule } from '@angular/core';
import { RouterModule, Routes, Router } from '@angular/router';
import { PostListComponent } from './posts/post-list/post-list.component';
import { PostCreateComponent } from './posts/post-create-edit/post-create.component';
import { AuthGuard } from './auth/auth.guard';
import { Component404 } from './404/404.component';
import { FrontPageComponent } from './front-page/front-page.component';
import { TrackingComponent } from './tracking/tracking.component';

const routes: Routes = [
  { path: '', component: FrontPageComponent},
  { path: 'posts', component: PostListComponent},
  { path: 'create', component: PostCreateComponent, canActivate: [AuthGuard]},
  { path: 'edit/:postId', component: PostCreateComponent, canActivate: [AuthGuard]},
  { path: 'tracking', component: TrackingComponent, canActivate: [AuthGuard]},
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
