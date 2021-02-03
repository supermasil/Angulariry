import { NgModule } from "@angular/core";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { AngularMaterialModule } from '../../angular-material.module';
import { CodeScannerComponent } from "./code-scanner.component";
import { CommonModule } from "@angular/common";
import { ScanditSdkModule } from "scandit-sdk-angular";
// const licenseKey = "AS2fwy8iD1jHGne5/yEE7/AywHX9K/13NRUpt5kYfikjf+LmpG+cJjR+pAgNUEYqaHmVBRAvCIvKSnGH0GYe7UMg4mL7H+mnNWxuaU4s5hpCYlt0JXIbVc196TkKe/PCDEp3Im1D++/yEZJv3kF+C6UfBSooA4Xu8rjx6L0I5kuH8bghHkFyQa0Za4J4KGUlgReVgjWg1jAyDSpyvF40C/UcmNgtITA47Sz4wqLbf0HVETGaQQiKrgW2BNgMNb95cmCBjCI0Zp07wB38X4eorxIJFXObopfYxAeU3i+ngzvMO6aZ27eVTnYYbHSKiGodsuKONiihJYh25Mc8UQYJlxclSr6TP7Exvg+b7yjUn31G78YHGgfOLPz0HaTrfKVSfXEs0uW6qRCxDsQ95J4Woze3iejs7VBcHQFUit0i07vsvo/pPFC1s3nfZ3x4+97Sg2rdcHjHtJ4RGdgRvPsBqvpM0421QtjNEGtoe5kGKRjri6hEDbJzRtaEjGubcE4jM8VFSHICZanqYQm7Y1x/XAjbd6A3Li49OCWP9jMX38t2MUbj9pXPuexV8lXFjFnZK6oXTPO9ok2EEscXltyN7MaBfkksFo8q+ko6hAaVQ4KmANaQza5urfZXS8hjv5TcJUC4MyO4uK1EXnoGB8dtFl7fWV9Ory09uwHZLhn9Bx6YkkxeqlndOIH8Cx/gaeuHgFXd/osYAtHBSLsSVx9C1sLfMgRl74v3CFON9rfD1TN8JWzvvRjNiezMEYLCwMBRZ5fOfnyuyA9jHh4oAhJnxrNRHQvT28gRN0VzVrtXqK5YPve8uUIOgE/6Yu6mgLfB66C43juv"
// const engineLocation = "https://cdn.jsdelivr.net/npm/scandit-sdk@5.x/build/";

@NgModule({
  declarations: [CodeScannerComponent],
  imports: [
    CommonModule,
    AngularMaterialModule,
    // ScanditSdkModule.forRoot(licenseKey, { engineLocation, preloadEngine: true, preloadBlurryRecognition: true })
    ],
  exports: [CodeScannerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [],
  bootstrap: [],
})
export class CodeScannerModule {}
