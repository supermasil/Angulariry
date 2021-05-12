import { Component, Input } from "@angular/core";
import { GlobalConstants } from "src/app/global-constants";

@Component({
  selector: 'barcodes-print',
  templateUrl: './barcode-print.component.html',
  styleUrls: ['./printing-forms.component.css'],
})
export class BarcodesPrint {
  @Input() tracking: any;
  globalConstants = GlobalConstants;
}
