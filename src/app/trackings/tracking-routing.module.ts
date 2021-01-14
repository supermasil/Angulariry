import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TrackingCreateEditComponent } from './tracking-create-edit/tracking-create-edit.component';



const routes: Routes = [
  { path: '', component: TrackingCreateEditComponent}
]

@NgModule({
  imports: [
    RouterModule.forChild(routes) // Lazy loading, will merge with root eventually
  ],
  exports: [RouterModule]
})
export class TrackingRoutingModule{}
