import { NgModule } from "@angular/core";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { AngularMaterialModule } from '../angular-material.module';
import { CodeScannerComponent } from "./code-scanner.component";
import { ScanditSdkModule } from "scandit-sdk-angular";
import { CommonModule } from "@angular/common";
const licenseKey = "AbSvESvhNMdSIJKYhj4Nlucp58OiO9KdnXEaxxRP3DSmbQ5yGCFbVKNtOnZISO91dmLwVf4yPajIdRITfFNb9bZuU4yLA2mDVlENTjpUoq24dSHgj1ORjcFdBdcfMiY+82hYIHl033GHEmfzTB98WdpDmiGUGChTIzSXYQ7BkZO1xEkHDRqD6brQAkqTbaUr7V6hq1S5c7u7qg/zhHQBy1J0wgvhAl04hZAkm5150u8tg/wOqCrEbu9znuWZJ3q7pJgTi+e/Jam3inEdJeAhx21lTPRk5rR/nbDBKXPaVFNZckur9sD390/IQLy23xWPTSQcvvh17UE4S9M0qAauM3uI4oCvMtNB6go9VShSDcB0LLlT4gKIp606V8H6wJmjgTzMkyx4Op2lgJ8KbmE8EP7J2tqCVX/h56sCZxPOczhD0c4hJ/B+TTcjI/cN1pUZEF+Jo8r8PVFL695SU5VekjrOA+6PVAQC/bByv25MhzERL8HSXATbXzqNgAKgfcONWS3RkcVqUARK/GnRuSWUYhAYi72v4snr+GdZcdBN+DBKE5krquWGdgVwlJZwG+esDMIUvstlCd/4f0WQV7rasS7UOEhuG9qs9VMX5y3luz7wqKpyzLOeD04syie9vSJiuDMhkXzylhK0ICcb215JmcMcSTs5cdbTe5HApXbKxgINY6N4AOow9IWUHwg+FqcHLTLvBDy8qQqihPm6UEj1G43XeWrA5yYcTiPUEZ1iGs6A9MECjybwLAh+R4e69SMsFbVR4YA1TbPCYpDD7iHqFBzGKlZc1/UFIoXvfHNkAjskNVeER2aJPk6vUOgYEdw+obC+iRav";
const engineLocation = "https://cdn.jsdelivr.net/npm/scandit-sdk@4.x/build";

@NgModule({
  declarations: [CodeScannerComponent],
  imports: [
    CommonModule,
    AngularMaterialModule,
    ScanditSdkModule.forRoot(licenseKey, { engineLocation, preloadEngine: true, preloadBlurryRecognition: true })],
  exports: [CodeScannerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [],
  bootstrap: [],
})
export class CodeScannerModule {}
