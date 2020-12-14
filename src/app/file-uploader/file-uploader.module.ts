import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AngularMaterialModule } from '../angular-material.module';
import { FileUploaderComponent } from "./file-uploader.component";

@NgModule({
  declarations: [FileUploaderComponent],
  imports: [
    BrowserModule,
    AngularMaterialModule],
  exports: [FileUploaderComponent]
})
export class FileUploaderModule {}
