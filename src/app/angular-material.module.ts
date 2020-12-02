import { NgModule } from '@angular/core';
import { MatInputModule } from '@angular/material/input'; // Unlock input material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatStepperModule } from '@angular/material/stepper';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';


@NgModule({
  // imports: [ // Not needed
  //   MatInputModule,
  //   MatCardModule,
  //   MatButtonModule,
  //   MatToolbarModule,
  //   MatExpansionModule,
  //   MatProgressSpinnerModule,
  //   MatPaginatorModule,
  //   MatDialogModule
  // ],
  exports: [
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatToolbarModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatDialogModule,
    MatSliderModule,
    MatIconModule,
    MatDividerModule,
    MatTabsModule,
    MatSelectModule,
    MatOptionModule,
    MatGridListModule,
    MatStepperModule,
    MatBadgeModule,
    MatSlideToggleModule,
    MatFormFieldModule
  ]
})

export class AngularMaterialModule {
}
