// Fixed fictional prefill for the upload/review UI. No OCR runs on the uploaded pages.
export const samplePhsValues: Record<string, string> = {
  application_date: "2026-10-23", position_applied: "Security Guard", contact_number: "09170000000",
  license_number: "SAMPLE-LES-2026-0182", badge_number: "SAMPLE-0182", sbr_number: "SAMPLE-SBR-001", license_expires_on: "2027-08-18",
  sss_number: "SAMPLE-SSS-001", philhealth_number: "SAMPLE-PH-001", pagibig_number: "SAMPLE-HDMF-001", tin: "SAMPLE-TIN-001",
  first_name: "Miguel", middle_name: "Garcia", last_name: "Reyes", name_suffix: "", nickname: "Migs",
  home_address: "12 Sample Street, Barangay Commonwealth, Quezon City", provincial_address: "24 Example Road, San Mateo, Rizal", relative_address: "24 Example Road, San Mateo, Rizal",
  birth_date: "1998-05-14", birth_place: "Quezon City", height: "175", weight: "72", eye_color: "Brown", sex: "Male", hair_color: "Black", distinguishing_marks: "Small scar on left forearm",
  civil_status: "Married", citizenship: "Filipino", religion: "Roman Catholic", spouse_name: "Ana Santos Reyes", spouse_occupation: "Teacher", children_count: "1",
  father_name: "Roberto Reyes", father_occupation: "Driver", father_age: "56", mother_name: "Elena Garcia Reyes", mother_occupation: "Store owner", mother_age: "54",
  emergency_name: "Ana Santos Reyes", emergency_relationship: "Spouse", emergency_address: "12 Sample Street, Barangay Commonwealth, Quezon City", emergency_phone: "09170000001",
  languages: "Filipino, English", skills: "First aid, radio communication, incident reporting",
  elementary_school: "Example Elementary School", elementary_year: "2010", secondary_school: "Example National High School", secondary_year: "2014",
  college: "Example City College", college_year: "2018", college_course: "Criminology", degree: "Bachelor of Science in Criminology", vocational_course: "Basic Security Training", vocational_year: "2021",
  separation_reason: "Completed client assignment", referred_by: "Agency recruitment office",
  service_rank: "Not applicable — civilian", service_number: "Not applicable", branch_of_service: "Not applicable", unit_assigned: "Not applicable",
  service_from: "", service_until: "", service_rating: "Not applicable", service_schooling: "Not applicable", service_separation: "Not applicable", service_separation_date: "",
  criminal_case: "No", case_details: "None declared", smokes: "No", smoking_duration: "Not applicable", gambles: "No", gambling_details: "None declared",
  background_consent: "Yes", medical_consent: "Yes", training_consent: "Yes", overtime_consent: "Yes", drinks_alcohol: "No", alcohol_duration: "Not applicable", alcohol_frequency: "Not applicable", policy_consent: "Yes", assignment_consent: "Yes",
};
export function samplePhsRows(): Record<string, string[][]> {
  return {
    siblings: [["Carlo Reyes", "26", "San Mateo, Rizal", "Technician"], ["Maria Reyes", "23", "Quezon City", "Office assistant"]],
    dependents: [["Sofia Reyes", "Daughter", "5"]],
    seminars: [["2021-03-01 to 2021-03-31", "Basic Security Training", "2021-03-31", "Certificate of completion"], ["2025-06-10 to 2025-06-11", "First Aid and Emergency Response", "2025-06-11", "Certificate of completion"]],
    employment: [["Example Security Agency", "2022-01 to 2026-06", "Security Guard", "PHP 18,000 / month"], ["Example Property Services", "2019-06 to 2021-12", "Security Assistant", "PHP 15,000 / month"]],
    references: [["Daniel Cruz", "Quezon City", "Former supervisor"], ["Marissa Flores", "San Mateo, Rizal", "Teacher"], ["Ramon Villanueva", "Marikina City", "Business owner"]],
  };
}
