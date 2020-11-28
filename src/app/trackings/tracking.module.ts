import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMaterialModule } from '../angular-material.module';
import { AppRoutingModule } from '../app-routing.module';
import { CodeScannerModule } from '../code-scanner/code-scanner.module';
import { TrackingCreateComponent } from './tracking-create-edit/tracking-create.component';
import { TrackingListComponent } from './tracking-list/tracking-list.component';
// import { TrackingListComponent } from './tracking-list/tracking-list.component';
import { TrackingToolComponent } from './tracking-tool/tracking-tool.component';

@NgModule({
  declarations: [
    TrackingToolComponent,
    TrackingListComponent,
    TrackingCreateComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    AppRoutingModule,
    ReactiveFormsModule,
    CodeScannerModule
  ]
})
export class TrackingModule {

}
