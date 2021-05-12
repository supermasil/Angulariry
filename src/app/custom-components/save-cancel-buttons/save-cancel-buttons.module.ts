import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AngularMaterialModule } from 'src/app/angular-material.module';
import { SaveCancelButtonsComponent } from './save-cancel-buttons.component';

@NgModule({
  declarations: [
    SaveCancelButtonsComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule.forChild()
  ],
  exports: [
    SaveCancelButtonsComponent
  ]
})
export class SaveCancelButtonsModule{}
