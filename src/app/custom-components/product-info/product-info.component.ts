import { Component} from "@angular/core";
import { TranslateService } from "@ngx-translate/core";


@Component({
  selector: 'product-info',
  templateUrl: './product-info.component.html',
  styleUrls: ['./product-info.component.css']
})
export class ProductInfoComponent {
  constructor(
    public translateService: TranslateService
  ) {}
}
