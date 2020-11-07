export class GeneralMethods {
  // Methods in html will be invoked every time there's change detected
  public static capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}
