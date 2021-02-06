import { CodeScannerService } from './code-scanner.service';
import { Component } from "@angular/core";
import { Barcode, BarcodePicker, Camera, CameraAccess, CameraSettings, ScanResult, ScanSettings } from 'scandit-sdk-angular';


@Component({
  selector: "app-code-scanner",
  templateUrl: './code-scanner.component.html',
  styleUrls: ['./code-scanner.component.css']
})
export class CodeScannerComponent {
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
  public enableSoundOnScan: boolean = true;

  public possibleCameras: Camera[] = [];

  constructor(private codeScannerService: CodeScannerService) {
    this.activeSettings = new ScanSettings({
      enabledSymbologies: [Barcode.Symbology.QR, Barcode.Symbology.PDF417, Barcode.Symbology.MAXICODE, Barcode.Symbology.CODE128, Barcode.Symbology.EAN8, Barcode.Symbology.UPCA, Barcode.Symbology.UPCE, Barcode.Symbology.EAN13],
      maxNumberOfCodesPerFrame: 1,
      searchArea: {"x":0,"y":0.25,"width":1,"height":0.5},
      codeDuplicateFilter: 500,
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
}
