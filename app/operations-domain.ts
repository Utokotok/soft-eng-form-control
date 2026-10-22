import { GUARD, today, type Store } from "./domain";

export type Client = { client_id: string; client_name: string; business_address: string; contact_name: string; contact_number: string; contact_email: string | null; status: "active"; created_at: string };
export type ClientSite = { site_id: string; client_id: string; site_name: string; site_address: string; region_code: string; status: "active" };
export type Post = { post_id: string; site_id: string; post_name: string; required_guards: number; status: "active" };
export type Deployment = { deployment_id: string; employee_id: number; post_id: string; start_at: string; end_at: string | null; status: "active" };
export type Shift = { shift_assignment_id: string; deployment_id: string; scheduled_start: string; scheduled_end: string; rest_day_indicator: boolean; status: "assigned" };
export type DdoAssignment = { ddo_assignment_id: string; ddo_id: string; deployment_id: string; assignment_from: string; assignment_until: string; status: "active" };
export type OperationsData = { clients: Client[]; sites: ClientSite[]; posts: Post[]; deployments: Deployment[]; shifts: Shift[]; ddoAssignments: DdoAssignment[] };
export const guards = [GUARD, { employee_id: 194, employee_number: "GD-0194", name: "Angela Reyes", employment_status: "active", license_expires_on: "2027-09-10" }];
export const ddos = [
  { ddo_id: "DDO-94", ddo_number: "DDO-2026-0094", valid_from: "2026-01-01T00:00:00+08:00", valid_until: "2027-01-01T00:00:00+08:00", status: "active" },
  { ddo_id: "DDO-95", ddo_number: "DDO-2026-0095", valid_from: "2026-10-01T00:00:00+08:00", valid_until: "2027-04-01T00:00:00+08:00", status: "active" },
];
export const initialOperations: OperationsData = {
  clients: [{ client_id: "CLIENT-01", client_name: "Northpoint Properties", business_address: "Quezon City", contact_name: "Site Administration", contact_number: "0280000000", contact_email: null, status: "active", created_at: "2026-01-01T00:00:00+08:00" }],
  sites: [{ site_id: "SITE-01", client_id: "CLIENT-01", site_name: "Northpoint Corporate Center", site_address: "Quezon City", region_code: "NCR", status: "active" }],
  posts: [{ post_id: "POST-01", site_id: "SITE-01", post_name: "Main entrance", required_guards: 2, status: "active" }, { post_id: "POST-02", site_id: "SITE-01", post_name: "Roving patrol", required_guards: 1, status: "active" }],
  deployments: [], shifts: [], ddoAssignments: [],
};
export function operations(store: Store): OperationsData { return store.operations || initialOperations; }
export function readLocalDate(value: string) { return Date.parse(`${value}:00+08:00`); }
export function isoLocal(value: string) { return new Date(readLocalDate(value)).toISOString(); }
export type ScheduleValues = { guard: string; site: string; post: string; deploymentStart: string; deploymentEnd: string; shiftStart: string; shiftEnd: string; ddo: string; restDay: boolean };
export function validateSchedule(values: ScheduleValues, data: OperationsData): Record<string, string> {
  const errors: Record<string, string> = {};
  const guard = guards.find(row => row.employee_id === Number(values.guard));
  const post = data.posts.find(row => row.post_id === values.post && row.site_id === values.site && row.status === "active");
  const site = data.sites.find(row => row.site_id === values.site && row.status === "active");
  const ddo = ddos.find(row => row.ddo_id === values.ddo);
  if (!guard || guard.employment_status !== "active" || guard.license_expires_on < today()) errors.guard = "Choose an active guard with a valid security license.";
  if (!site) errors.site = "Select an active client site.";
  if (!post) errors.post = "Choose a post belonging to the selected site.";
  for (const key of ["deploymentStart", "shiftStart", "shiftEnd"] as const) if (!values[key] || !Number.isFinite(readLocalDate(values[key]))) errors[key] = "Enter a valid date and time.";
  const start = readLocalDate(values.deploymentStart), end = values.deploymentEnd ? readLocalDate(values.deploymentEnd) : Infinity;
  const shiftStart = readLocalDate(values.shiftStart), shiftEnd = readLocalDate(values.shiftEnd);
  if (values.deploymentEnd && (!Number.isFinite(end) || end <= start)) errors.deploymentEnd = "Deployment end must be after its start.";
  if (Number.isFinite(shiftStart) && Number.isFinite(shiftEnd) && shiftEnd <= shiftStart) errors.shiftEnd = "Shift end must be after its start. Use the next date for an overnight shift.";
  if (shiftStart < start || shiftEnd > end) errors.shiftStart = "The shift must fall within the deployment period.";
  if (!ddo) errors.ddo = "Choose a Duty Detail Order.";
  else if (start < Date.parse(ddo.valid_from) || shiftEnd > Date.parse(ddo.valid_until) || (Number.isFinite(end) && end > Date.parse(ddo.valid_until))) errors.ddo = "The DDO must cover the deployment and scheduled shift.";
  const overlaps = (a: number, b: number, c: number, d: number) => a < d && c < b;
  if (data.deployments.some(row => row.employee_id === guard?.employee_id && row.status === "active" && overlaps(start, end, Date.parse(row.start_at), row.end_at ? Date.parse(row.end_at) : Infinity))) errors.guard = "This guard already has an overlapping active deployment.";
  if (post) {
    const assigned = data.shifts.filter(row => {
      const deployment = data.deployments.find(record => record.deployment_id === row.deployment_id);
      return row.status === "assigned" && deployment?.status === "active" && deployment.post_id === post.post_id && overlaps(shiftStart, shiftEnd, Date.parse(row.scheduled_start), Date.parse(row.scheduled_end));
    }).length;
    if (assigned >= post.required_guards) errors.post = "This post is fully staffed for the selected shift.";
  }
  return errors;
}
