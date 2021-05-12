// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiURL: "http://localhost:3000/api",
  firebaseConfig: {
    apiKey: "AIzaSyC486KOce4Pxch0PUoGypgI88wUKz4ztMM",
    authDomain: "musicacademy-fac23.firebaseapp.com",
    databaseURL: "https://musicacademy-fac23.firebaseio.com",
    projectId: "musicacademy-fac23",
    storageBucket: "musicacademy-fac23.appspot.com",
    messagingSenderId: "272643700943",
    appId: "1:272643700943:web:1fb2bcd9dc29580285dfba",
    measurementId: "G-CHLV454M2D"
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
