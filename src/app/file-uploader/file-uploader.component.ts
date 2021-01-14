import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { NgxImageCompressService } from 'ngx-image-compress';
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
  fileNames: string[] = [];
  filesToDelete = [];

  constructor(
    private imageCompress: NgxImageCompressService,
  ) {}

  ngOnInit(): void {
    this.fileUploaderForm = new FormGroup({
      fileValidator: new FormControl(null, {asyncValidators: [mimeType]})
    });
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
        this.fileNames.push(file.name);
      };
    reader.readAsDataURL(file); // This will kick off onload process
  }

  deleteFile(index: number, url: string) {
    this.filesPreview.splice(index, 1);

    let i = this.filesToAdd.indexOf(url);
    if (i >= 0) {
      this.filesToAdd.splice(i, 1);
      this.fileNames.splice(i, 1);
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

  setExistingFilePath(filePaths: string[]) {
    this.existingFilePaths = filePaths;
  }

  getFilesToAdd() {
    return this.filesToAdd;
  }

  getFilesToDelete() {
    return this.filesToDelete;
  }

  getFileNames() {
    return this.fileNames;
  }

}
