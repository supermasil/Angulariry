import { CodeScannerService } from './code-scanner.service';
// import Quagga from 'quagga';
import { Component } from "@angular/core";
import { Barcode, BarcodePicker, Camera, CameraAccess, CameraSettings, ScanResult, ScanSettings } from 'scandit-sdk-angular';


@Component({
  selector: "app-code-scanner",
  templateUrl: './code-scanner.component.html',
  styleUrls: ['./code-scanner.component.css']
})
export class CodeScannerComponent {

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

  public activeSettings: ScanSettings;
  public scannerGuiStyle: BarcodePicker.GuiStyle = BarcodePicker.GuiStyle.LASER;
  public activeCamera: Camera;
  public cameraSettings: CameraSettings;
  public scanningPaused: boolean = false;
  public visible: boolean = true;
  public fps: number = 30;
  public videoFit: BarcodePicker.ObjectFit = BarcodePicker.ObjectFit.COVER;;
  public scannedCodes: Barcode[] = [];
  public isReady: boolean = false;
  public enableCameraSwitcher: boolean = false;
  public enablePinchToZoom: boolean = false;
  public enableTapToFocus: boolean = false;
  public enableTorchToggle: boolean = false;
  public enableVibrateOnScan: boolean = false;
  public cameraAccess: boolean = true;
  public enableSoundOnScan: boolean = false;
  isOpen = false;

  public possibleCameras: Camera[] = [];

  constructor(private codeScannerService: CodeScannerService) {
    this.activeSettings = new ScanSettings({
      enabledSymbologies: [Barcode.Symbology.CODE128, Barcode.Symbology.EAN8, Barcode.Symbology.UPCA, Barcode.Symbology.UPCE, Barcode.Symbology.EAN13],
      maxNumberOfCodesPerFrame: 1,
      searchArea: {"x":0,"y":0.35,"width":1,"height":0.3},
      codeDuplicateFilter: 1000,
    });

    CameraAccess.getCameras().then((cameras) => {
      this.possibleCameras = cameras;
    });

    this.cameraSettings = {
      resolutionPreference: CameraSettings.ResolutionPreference.FULL_HD,
    };
  }


  public onScan(result: ScanResult): void {
    this.codeScannerService.updateCodeScannerUpdateListener(result.barcodes[0].data);
  }

  scannerClick() {
    this.isOpen = !this.isOpen;
  }
}
