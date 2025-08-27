import { HostingLocationOption } from "../interfaces/global.interface";

export const recordsPerPage = {
  sizes: [25, 50, 100, 150, 200],
  defaultSize: 50,
};

export const hostingLocationOptions: Array<HostingLocationOption> = [
  { code: 'exelixis_controlled', option: 'Exelixis Controlled' },
  { code: 'vendor_controlled', option: 'Vendor Controlled' },
  { code: 'hybrid', option: 'Hybrid' }
];