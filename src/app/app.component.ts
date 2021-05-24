import { Component, Inject, LOCALE_ID, Renderer2 } from '@angular/core';
import { ConfigService } from '../@vex/services/config.service';
import { Settings } from 'luxon';
import { DOCUMENT } from '@angular/common';
import { Platform } from '@angular/cdk/platform';
import { NavigationService } from '../@vex/services/navigation.service';
import { LayoutService } from '../@vex/services/layout.service';
import { ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { SplashScreenService } from '../@vex/services/splash-screen.service';
import { Style, StyleService } from '../@vex/services/style.service';
import { ConfigName } from '../@vex/interfaces/config-name.model';

import homeTwotone from '@iconify/icons-ic/twotone-home';
import twotoneEarbuds from '@iconify/icons-ic/twotone-earbuds';
import twotoneDataSaverOn from '@iconify/icons-ic/twotone-data-saver-on';
import twotoneCalculate from '@iconify/icons-ic/twotone-calculate';
import twotoneAccountCircle from '@iconify/icons-ic/twotone-account-circle';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Weshippee';

  constructor(private configService: ConfigService,
              private styleService: StyleService,
              private renderer: Renderer2,
              private platform: Platform,
              @Inject(DOCUMENT) private document: Document,
              @Inject(LOCALE_ID) private localeId: string,
              private layoutService: LayoutService,
              private route: ActivatedRoute,
              private navigationService: NavigationService,
              private splashScreenService: SplashScreenService) {
    Settings.defaultLocale = this.localeId;

    if (this.platform.BLINK) {
      this.renderer.addClass(this.document.body, 'is-blink');
    }

    /**
     * Customize the template to your needs with the ConfigService
     * Example:
     *  this.configService.updateConfig({
     *    sidenav: {
     *      title: 'Custom App',
     *      imageUrl: '//placehold.it/100x100',
     *      showCollapsePin: false
     *    },
     *    showConfigButton: false,
     *    footer: {
     *      visible: false
     *    }
     *  });
     */

    /**
     * Config Related Subscriptions
     * You can remove this if you don't need the functionality of being able to enable specific configs with queryParams
     * Example: example.com/?layout=apollo&style=default
     */
    this.route.queryParamMap.pipe(
      map(queryParamMap => queryParamMap.has('rtl') && coerceBooleanProperty(queryParamMap.get('rtl'))),
    ).subscribe(isRtl => {
      this.document.body.dir = isRtl ? 'rtl' : 'ltr';
      this.configService.updateConfig({
        rtl: isRtl
      });
    });

    this.route.queryParamMap.pipe(
      filter(queryParamMap => queryParamMap.has('layout'))
    ).subscribe(queryParamMap => this.configService.setConfig(queryParamMap.get('layout') as ConfigName));

    this.route.queryParamMap.pipe(
      filter(queryParamMap => queryParamMap.has('style'))
    ).subscribe(queryParamMap => this.styleService.setStyle(queryParamMap.get('style') as Style));


    this.navigationService.items = [
      {
        type: 'link',
        label: 'AIO',
        route: '/aio',
        icon: homeTwotone
      },
      {
        type: 'link',
        label: 'Home',
        route: '/',
        icon: homeTwotone
      },
      {
        type: 'subheading',
        label: 'Trackings',
        children: [
          {
            type: 'link',
            label: 'View Trackings',
            route: '/trackings',
            icon: twotoneEarbuds
          },
          {
            type: 'dropdown',
            label: 'Create Trackings',
            icon: twotoneDataSaverOn,
            children: [
              {
                type: 'link',
                label: 'Online',
                route: '/trackings/create/onl'
              },
              {
                type: 'link',
                label: 'In Person',
                route: '/trackings/create/inp'
              },
              {
                type: 'link',
                label: 'Consolidated',
                route: '/trackings/create/csl'
              },
              {
                type: 'link',
                label: 'Master',
                route: '/trackings/create/mst'
              }
            ]
          }, 
        ]
      },
      {
        type: 'subheading',
        label: 'Pricing Management',
        children: [
          {
            type: 'dropdown',
            label: 'Pricing',
            icon: twotoneCalculate,
            children: [
              {
                type: 'link',
                label: 'Create New Item',
                route: '/pricings/new'
              },
              {
                type: 'link',
                label: 'Edit Item',
                route: '/pricings/edit'
              },
              {
                type: 'link',
                label: 'Custom Pricing',
                route: '/pricings/custom'
              }
            ]
          }, 
        ]
      },
      {
        type: 'subheading',
        label: 'Users Management',
        children: [
          {
            type: 'dropdown',
            label: 'Users',
            icon: twotoneAccountCircle,
            children: [
              {
                type: 'link',
                label: 'View User',
                route: '/auth/users'
              },
              {
                type: 'link',
                label: 'Adjust Credit',
                route: '/auth/users/adjustCredit'
              },
              {
                type: 'link',
                label: 'New User',
                route: '/auth/users/new'
              },
              {
                type: 'link',
                label: 'New Organization',
                route: '/auth/orgs/new'
              }
            ]
          }, 
        ]
      },
      {
        type: 'subheading',
        label: 'Reports',
        children: [
          {
            type: 'dropdown',
            label: 'Reports',
            icon: twotoneAccountCircle,
            children: [
              {
                type: 'link',
                label: 'Trackings Report',
                route: '/reports/trackings'
              },
              {
                type: 'link',
                label: 'Users Report',
                route: '/reports/users'
              }
            ]
          }, 
        ]
      }
    ];
  }
}
