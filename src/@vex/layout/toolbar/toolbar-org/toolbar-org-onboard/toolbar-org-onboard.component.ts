import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import icClose from '@iconify/icons-ic/twotone-close';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'vex-toolbar-org-onboarding',
  templateUrl: 'toolbar-org-onboard.component.html'
})
export class ToolbarOrgOnboardComponent implements OnInit{
  constructor(
    private authService: AuthService,
    private dialogRef: MatDialogRef<ToolbarOrgOnboardComponent>
  ) {}

  icClose = icClose;

  ngOnInit() {}

  onboard(registerCode: string, referralCode: string) {
    this.authService.onboardToNewOrg(registerCode, referralCode);
  }

  close() {
    this.dialogRef.close();
  }
}
