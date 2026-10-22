export type PhsField = { key: string; label: string; type?: string; required?: boolean; options?: string[] };
export type PhsGroup = { title: string; fields: PhsField[] };
const yesNo = ["Yes", "No"];
export const phsGroups: PhsGroup[] = [
  { title: "Application & identification", fields: [
    { key: "application_date", label: "Date of application", type: "date" }, { key: "position_applied", label: "Application for" },
    { key: "contact_number", label: "Contact number", type: "tel", required: true }, { key: "license_number", label: "License number" }, { key: "badge_number", label: "Badge number" }, { key: "sbr_number", label: "SBR number" }, { key: "license_expires_on", label: "License expiry", type: "date" },
    { key: "sss_number", label: "SSS number" }, { key: "philhealth_number", label: "PhilHealth number" }, { key: "pagibig_number", label: "Pag-IBIG number" }, { key: "tin", label: "TIN" },
  ] },
  { title: "Personal data", fields: [
    { key: "last_name", label: "Last name", required: true }, { key: "first_name", label: "First name", required: true }, { key: "middle_name", label: "Middle name" }, { key: "name_suffix", label: "Suffix" }, { key: "nickname", label: "Nickname" },
    { key: "home_address", label: "City / home address", required: true }, { key: "provincial_address", label: "Provincial address" }, { key: "relative_address", label: "Relative’s address" }, { key: "birth_date", label: "Date of birth", type: "date", required: true }, { key: "birth_place", label: "Place of birth" },
    { key: "height", label: "Height (cm)", type: "number" }, { key: "weight", label: "Weight (kg)", type: "number" }, { key: "eye_color", label: "Eye color" }, { key: "sex", label: "Sex", options: ["Male", "Female"] }, { key: "hair_color", label: "Hair color" }, { key: "distinguishing_marks", label: "Distinguishing marks" },
    { key: "civil_status", label: "Civil status", options: ["Single", "Married", "Widowed", "Separated"] }, { key: "citizenship", label: "Citizenship" }, { key: "religion", label: "Religion" },
  ] },
  { title: "Family & emergency contact", fields: [
    { key: "spouse_name", label: "Spouse’s name" }, { key: "spouse_occupation", label: "Spouse’s occupation" }, { key: "children_count", label: "Number of children", type: "number" },
    { key: "father_name", label: "Father’s name" }, { key: "father_occupation", label: "Father’s occupation" }, { key: "father_age", label: "Father’s age", type: "number" },
    { key: "mother_name", label: "Mother’s name" }, { key: "mother_occupation", label: "Mother’s occupation" }, { key: "mother_age", label: "Mother’s age", type: "number" },
    { key: "emergency_name", label: "Emergency contact" }, { key: "emergency_relationship", label: "Relationship" }, { key: "emergency_address", label: "Emergency contact address" }, { key: "emergency_phone", label: "Emergency contact telephone", type: "tel" },
  ] },
  { title: "Education & skills", fields: [
    { key: "languages", label: "Languages / dialects spoken" }, { key: "skills", label: "Special skills" },
    { key: "elementary_school", label: "Elementary school" }, { key: "elementary_year", label: "Year graduated" },
    { key: "secondary_school", label: "Secondary school" }, { key: "secondary_year", label: "Year graduated" },
    { key: "college", label: "College" }, { key: "college_year", label: "Year graduated" }, { key: "college_course", label: "Course" }, { key: "degree", label: "Degree earned" }, { key: "vocational_course", label: "Vocational course" }, { key: "vocational_year", label: "Year graduated" },
  ] },
  { title: "Employment & service background", fields: [
    { key: "separation_reason", label: "Reason for separation from last employer" }, { key: "referred_by", label: "Referred by" },
    { key: "service_rank", label: "Military / police rank" }, { key: "service_number", label: "Service number" }, { key: "branch_of_service", label: "Branch of service" }, { key: "unit_assigned", label: "Unit assigned" }, { key: "service_from", label: "Service from", type: "date" }, { key: "service_until", label: "Service until", type: "date" }, { key: "service_rating", label: "Rating" }, { key: "service_schooling", label: "Military / police schooling" }, { key: "service_separation", label: "Cause of separation" }, { key: "service_separation_date", label: "Separation date", type: "date" },
  ] },
  { title: "Declarations", fields: [
    { key: "criminal_case", label: "Accused of or convicted of an offense?", options: yesNo }, { key: "case_details", label: "Nature and status of cases" },
    { key: "smokes", label: "Smokes?", options: yesNo }, { key: "smoking_duration", label: "Smoking duration" }, { key: "gambles", label: "Habitual gambling?", options: yesNo }, { key: "gambling_details", label: "Gambling activities stated" },
    { key: "background_consent", label: "Willing to undergo background verification?", options: yesNo }, { key: "medical_consent", label: "Willing to undergo drug / neuro-psychiatric tests?", options: yesNo },
    { key: "training_consent", label: "Willing to attend training / orientation?", options: yesNo }, { key: "overtime_consent", label: "Willing to work overtime?", options: yesNo },
    { key: "drinks_alcohol", label: "Drinks intoxicating beverages?", options: yesNo }, { key: "alcohol_duration", label: "Drinking duration" }, { key: "alcohol_frequency", label: "Drinking frequency" }, { key: "policy_consent", label: "Agrees to agency policies?", options: yesNo }, { key: "assignment_consent", label: "Willing to be assigned anywhere?", options: yesNo },
  ] },
];
export const repeatGroups = [
  { key: "siblings", title: "Brothers & sisters", columns: ["Name", "Age", "Address", "Occupation"] },
  { key: "dependents", title: "Dependents", columns: ["Name", "Relationship", "Age"] },
  { key: "seminars", title: "Seminars & training", columns: ["Inclusive dates", "Course title", "Date graduated", "Awards / commendations"] },
  { key: "employment", title: "Employment history", columns: ["Employer", "Inclusive dates", "Position", "Salary received"] },
  { key: "references", title: "Character references", columns: ["Name", "Address", "Occupation"] },
];
