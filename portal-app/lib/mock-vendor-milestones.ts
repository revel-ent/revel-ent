export type VendorMilestoneStatus = 'pending' | 'acknowledged' | 'completed';

export interface VendorMilestone {
  id: string;
  eventId: string;
  vendorType: string;
  title: string;
  dueDate: string;
  status: VendorMilestoneStatus;
  amountDue?: number;
  amountVisibleToVendor: boolean;
  note: string;
}

const VENDOR_MILESTONES: VendorMilestone[] = [
  {
    id: 'vm-1',
    eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
    vendorType: 'Decor',
    title: 'Design concept board approval',
    dueDate: '2026-07-10',
    status: 'pending',
    amountVisibleToVendor: false,
    note: 'Client confirmation required before procurement.'
  },
  {
    id: 'vm-2',
    eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
    vendorType: 'Catering',
    title: 'Menu tasting deposit',
    dueDate: '2026-08-01',
    status: 'pending',
    amountDue: 1200,
    amountVisibleToVendor: false,
    note: 'Due date visible to clients; amount only visible to internal and client financial roles.'
  },
  {
    id: 'vm-3',
    eventId: 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
    vendorType: 'Photo/Video',
    title: 'Shot list and family grouping lock',
    dueDate: '2026-10-20',
    status: 'acknowledged',
    amountVisibleToVendor: true,
    note: 'Photographer can upload gallery links and preview sets after event.'
  }
];

export function getVendorMilestonesForEvent(eventId: string): VendorMilestone[] {
  return VENDOR_MILESTONES.filter((item) => item.eventId === eventId);
}
