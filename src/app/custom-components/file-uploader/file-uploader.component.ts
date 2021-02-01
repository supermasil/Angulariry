import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { NgxImageCompressService } from 'ngx-image-compress';
import { Observable } from 'rxjs';
import { mimeType } from './mime-type.validator';


@Component({
  selector: 'file-uploader',
  templateUrl: './file-uploader.component.html',
  styleUrls: ['./file-uploader.component.css']
})
export class FileUploaderComponent implements OnInit{

  fileUploaderForm: FormGroup;

  existingFilePaths: string[] = []; // Edit case
  filesPreview: string[] = [];
  filesToAdd: string[] = [];
  fileNamesToAdd: string[] = [];
  filesToDelete = [];

  @Input() currentFilePathsObservable: Observable<string[]> = new Observable();

  constructor(
    private imageCompress: NgxImageCompressService,
  ) {}

  ngOnInit(): void {
    this.fileUploaderForm = new FormGroup({
      fileValidator: new FormControl(null, {asyncValidators: [mimeType]})
    });

    this.currentFilePathsObservable.subscribe((files: string[]) => {
      this.existingFilePaths = [...files];
      this.filesPreview = [...files];
    })
  }

  onFilePicked(event: Event) {
    const file = (event.target as HTMLInputElement).files[0];

    if (!file) {
      return;
    }

    // Trigger mimetype validator
    this.fileUploaderForm.patchValue({fileValidator: file}); // Target a single control
    this.fileUploaderForm.get('fileValidator').updateValueAndValidity(); // Update and validate without html form

    const reader = new FileReader();
    reader.onload = async () => { // When done loading
        let compressedFile = await this.compressFile(reader.result as string).then();
        if (this.filesPreview.includes(compressedFile)) {
          return;
        }
        this.filesPreview.push(compressedFile);
        this.filesToAdd.push(compressedFile);
        this.fileNamesToAdd.push(file.name);
      };
    reader.readAsDataURL(file); // This will kick off onload process
  }

  deleteFile(index: number, url: string) {
    this.filesPreview.splice(index, 1);

    let i = this.filesToAdd.indexOf(url);
    if (i >= 0) {
      this.filesToAdd.splice(i, 1);
      this.fileNamesToAdd.splice(i, 1);
    }

    if (this.existingFilePaths.includes(url)) { //edit case
      this.filesToDelete.push(url);
    }
  }

  async compressFile(file: string) {
    return this.imageCompress.compressFile(file, 100, 70).then(
      result => {
        return result;
      });
  }

  getFilesToAdd() {
    return this.filesToAdd;
  }

  getFilesToDelete() {
    return this.filesToDelete;
  }

  getFileNamesToAdd() {
    return this.fileNamesToAdd;
  }

}
