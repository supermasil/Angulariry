import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FrontPageComponent } from './front-page.component';



const routes: Routes = [
  { path: '', component: FrontPageComponent}
]

@NgModule({
  imports: [
    RouterModule.forChild(routes) // Lazy loading, will merge with root eventually
  ],
  exports: [RouterModule]
})
export class FrontPageRoutingModule{}
