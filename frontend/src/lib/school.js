const SELECTED_SCHOOL_KEY = "campusTradeSelectedSchool";

export function getSelectedSchoolId(fallback = "school_uta") {
  return localStorage.getItem(SELECTED_SCHOOL_KEY) ?? fallback;
}

export function setSelectedSchoolId(schoolId) {
  localStorage.setItem(SELECTED_SCHOOL_KEY, schoolId);
}
