import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AngularMaterialModule } from '../../angular-material.module';
import { ProductInfoModule } from '../../custom-components/product-info/product-info.module';
import { SearchBarModule } from '../../custom-components/search-bar/search-bar.module';
import { TrackingListCommonModule } from '../../trackings/tracking-list/tracking-list-common/tracking-list-common.module';
import { FrontPageRoutingModule } from './front-page-routing.module';
import { FrontPageComponent } from './front-page.component';

@NgModule({
  declarations: [
    FrontPageComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    FrontPageRoutingModule,
    TranslateModule.forChild(),
    SearchBarModule,
    TrackingListCommonModule,
    ProductInfoModule
  ]
})
export class FrontPageModule {

}
