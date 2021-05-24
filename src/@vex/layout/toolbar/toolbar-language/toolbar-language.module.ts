import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarLanguageComponent } from './toolbar-language.component';
import { AngularMaterialModule } from 'src/app/angular-material.module';


@NgModule({
  declarations: [ToolbarLanguageComponent],
  imports: [
    CommonModule,
    AngularMaterialModule
  ],
  exports: [ToolbarLanguageComponent]
})
export class ToolbarLanguageModule {}