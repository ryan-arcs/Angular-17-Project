import { StatusDetails } from 'src/app/my-apps/iapp/interfaces/dashboardInterface';

export const statusWithCode: { [status: string]: number } = {
  'In-Progress': 1002,
  Exception: 1003,
  Completed: 1004,
  Error: 1005,
};

export const statusDetails: any = [
  {
    statusCode: 1001,
    statusLabel: 'Started',
    statusColor: '#15557f',
  },
  {
    statusCode: 1002,
    statusLabel: 'In-Progress',
    statusColor: '#4ADBFF',
  },
  {
    statusCode: 1003,
    statusLabel: 'Exception',
    statusColor: '#FF7433',
  },
  {
    statusCode: 1004,
    statusLabel: 'Completed',
    statusColor: '#008000',
  },
  {
    statusCode: 1005,
    statusLabel: 'Error',
    statusColor: '#ff0000',
  },
];

export const getStatusesToInclude = (): string[] => {
  return statusDetails.map((status: StatusDetails) => {
    return status.statusLabel;
  });
};
