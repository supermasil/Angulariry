export class AuthGlobals {
  // Alert Service
  public static roles = Object.freeze({
    SuperAdmin: "SuperAdmin",
    Admin: "Admin",
    Manager: "Manager",
    Accounting: "Accounting",
    Operation: "Operation",
    Sales: "Sales",
    Receiving: "Receiving",
    Shipping: "Shipping",
    Customer: "Customer"
  });

  public static everyone = Object.values(AuthGlobals.roles);
  public static internal = Object.values(AuthGlobals.roles).slice(0, 8);
  public static officers = Object.values(AuthGlobals.roles).slice(0, 6);
  public static nonManagers = Object.values(AuthGlobals.roles).slice(3);
  public static internalNonAdmin = Object.values(AuthGlobals.roles).slice(2, 8);
  public static nonAdmin = Object.values(AuthGlobals.roles).slice(2);
  public static nonSuperAdmin = Object.values(AuthGlobals.roles).slice(1);
  public static admins = Object.values(AuthGlobals.roles).slice(0,2);
  public static managerAdmins = Object.values(AuthGlobals.roles).slice(0, 3);
  public static nonAdminOfficers = Object.values(AuthGlobals.roles).slice(2, 6);
  public static nonSalesOfficers = Object.values(AuthGlobals.roles).slice(0, 5);
}
