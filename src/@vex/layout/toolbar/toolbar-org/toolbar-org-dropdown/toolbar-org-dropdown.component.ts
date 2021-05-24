import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MenuItem } from '../interfaces/menu-item.interface';
import { trackById } from '../../../../utils/track-by';
import icSettings from '@iconify/icons-ic/twotone-settings';
import icAccountCircle from '@iconify/icons-ic/twotone-account-circle';
import icChevronRight from '@iconify/icons-ic/twotone-chevron-right';
import icArrowDropDown from '@iconify/icons-ic/twotone-arrow-drop-down';
import icBusiness from '@iconify/icons-ic/twotone-business';
import icVerifiedUser from '@iconify/icons-ic/twotone-verified-user';
import icLock from '@iconify/icons-ic/twotone-lock';
import icNotificationsOff from '@iconify/icons-ic/twotone-notifications-off';
import icConfirmationNumber from '@iconify/icons-ic/outline-confirmation-number';
import baselineApartment from '@iconify/icons-ic/baseline-apartment';
import { Icon } from '@visurel/iconify-angular';
import { PopoverRef } from '../../../../components/popover/popover-ref';
import { AuthService } from 'src/app/auth/auth.service';
import { OrganizationModel } from 'src/app/models/organization.model';
import { UserModel } from 'src/app/models/user.model';
import { MatDialog } from '@angular/material/dialog';
import { ToolbarOrgOnboardComponent } from '../toolbar-org-onboard/toolbar-org-onboard.component';
import icOutlineNewLabel from '@iconify/icons-ic/open-in-new';
import { AuthGlobals } from 'src/app/auth/auth-globals';

export interface OnlineStatus {
  id: 'online' | 'away' | 'dnd' | 'offline';
  label: string;
  icon: Icon;
  colorClass: string;
}

@Component({
  selector: 'vex-toolbar-org-dropdown',
  templateUrl: './toolbar-org-dropdown.component.html',
  styleUrls: ['./toolbar-org-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolbarOrgDropdownComponent implements OnInit {
  trackById = trackById;
  icBuilding = baselineApartment;
  icSettings = icSettings;
  icChevronRight = icChevronRight;
  icArrowDropDown = icArrowDropDown;
  icBusiness = icBusiness;
  icVerifiedUser = icVerifiedUser;
  icLock = icLock;
  icNotificationsOff = icNotificationsOff;
  icOutlineNewLabel = icOutlineNewLabel;

  org: OrganizationModel;
  user: UserModel
  organizations : OrganizationModel[] = [];
  authGlobals = AuthGlobals;

  items: MenuItem[];

  constructor(private cd: ChangeDetectorRef,
              private popoverRef: PopoverRef<ToolbarOrgDropdownComponent>,
              private authService: AuthService,
              private dialog: MatDialog) { }

  ngOnInit() {
    this.authService.getMongoDbUserListener().subscribe(user => {
      this.user = this.authService.getMongoDbUser();
      this.authService.getOrganizationsByIds(this.user.organizations.map(o => o.organization)).subscribe((orgs: OrganizationModel[]) => {
        this.organizations = orgs;
      }, error => {
        console.log("FrontPageComponent: Couldn't get organizations", error.message);
      });
    });

    this.authService.getUserOrgListener().subscribe(org => {
      this.org = this.authService.getUserOrg();
      if (this.org) {
        this.items = [
          {
            id: '1',
            icon: icConfirmationNumber,
            label: this.org?.registerCode,
            description: '',
            colorClass: 'text-red',
            route: null
          }
        ];

        if (this.authGlobals.admins.includes(this.user?.role)) {
          this.items.push({
            id: '2',
            icon: icAccountCircle,
            label: 'auth.edit-organization',
            description: '',
            colorClass: 'text-teal',
            route: '/auth/orgs/edit/' + this.org?._id
          })
        }
      }
    });
  }

  close() {
    this.popoverRef.close();
  }

  companySelected(index: number) {
    if (index == -1) {
      let el: HTMLElement = document.getElementById("onboardButton");
      el.click();
    } else {
      let selectedOrg = this.organizations[index];
      this.authService.logInToOrg(selectedOrg._id);
      this.org = selectedOrg;
    }
  }

  onboard(registerCode: string, referralCode: string) {
    this.authService.onboardToNewOrg(registerCode, referralCode);
  }

  openDialog() {
    this.dialog.open(ToolbarOrgOnboardComponent, {
      width: '400px'
    });
  }
}
