import { CodeScannerService } from './code-scanner.service';
import Quagga from 'quagga';
import { Component, ViewChild, ElementRef } from "@angular/core";
import * as ScanditSDK from "scandit-sdk";
import { BarcodePicker, ScanResult } from "scandit-sdk";

@Component({
  selector: "app-code-scanner",
  templateUrl: './code-scanner.component.html',
  styleUrls: ['./code-scanner.component.html']
})
export class CodeScannerComponent {
  constructor(public codeScannerService: CodeScannerService) {}

  // decode(event: Event) {
  //   const file = (event.target as HTMLInputElement).files[0];

  //   if (!file) {
  //     return;
  //   }

  //   const reader = new FileReader();
  //   reader.onload = async () => { // When done loading
  //     Quagga.decodeSingle({
  //       decoder: {
  //           readers: ["code_128_reader", "ean_reader", "ean_8_reader", "upc_reader", "code_39_reader", "ean_8_reader"] // List of active readers
  //       },
  //       locate: true, // try to locate the barcode in the image
  //       src: reader.result as string // or 'data:image/jpg;base64,' + data
  //     }, (result) => {
  //         if(result) {
  //           if(result.codeResult) {
  //             this.codeScannerService.updateCodeScannerUpdateListener(result.codeResult.code);
  //             return;
  //           }
  //         }
  //         this.codeScannerService.updateCodeScannerUpdateListener("Code not detected, please try again");
  //     });
  //   };
  //   reader.readAsDataURL(file); // This will kick off onload process
  // }

  public scannerReady = false;
  public showButton = false;
  public showDescription = true;
  public result = "";

  @ViewChild("barcodePicker") barcodePickerElement: ElementRef<HTMLDivElement & { barcodePicker: BarcodePicker }>;

  public onReady(): void {
    this.scannerReady = true;
    this.showButton = true;
  }

  public onScan(scanResult: { detail: ScanResult }): void {
    const calculatedString = scanResult.detail.barcodes.reduce((result, barcode) => {
      return `${result} ${ScanditSDK.Barcode.Symbology.toHumanizedName(barcode.symbology)} : ${barcode.data}`;
    }, "");

    this.result = calculatedString;
  }

  public startBarcodePicker(): void {
    this.showButton = false;
    this.showDescription = false;

    this.barcodePickerElement.nativeElement.barcodePicker.setVisible(true).resumeScanning();
  }
}
