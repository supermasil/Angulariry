import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { NgModule } from '@angular/core';
import bootstrap from "bootstrap";
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { AppRoutingModule } from './app-routing.module';
import { AuthInterceptor } from './auth/auth-interceptor';
import { ErrorInterceptor } from './error-interceptor';
import { ErrorComponent } from './error/error.component';
import { AngularMaterialModule } from './angular-material.module';
import { FrontPageModule } from './front-page/front-page.module';
import { AngularFireModule } from '@angular/fire';
import { environment } from 'src/environments/environment';
import { AlertModule } from './alert-message';
import { NgxSpinnerModule } from 'ngx-spinner';
import { SpinnerInterceptor } from './spinner-interceptor';
import { NgxImageCompressService } from 'ngx-image-compress';
import { VarDirective } from './directives/ng-var.directive';


// import { AuthModule } from './auth/auth.module'; // Remove to make it lazily loader

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    ErrorComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AngularMaterialModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AlertModule,
    // TrackingModule,
    // PricingModule,
    FrontPageModule,
    NgxSpinnerModule
  ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: SpinnerInterceptor, multi: true},
    NgxImageCompressService
  ], // For services/ Interceptors
  bootstrap: [AppComponent],
  entryComponents: [ErrorComponent] // for components that are dynamically created
})
export class AppModule { }
