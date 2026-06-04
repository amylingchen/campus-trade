export function toSchool(row) {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    emailDomain: row.email_domain,
    city: row.city,
    state: row.state,
    logoUrl: row.logo_url,
    isActive: Boolean(row.is_active),
  };
}

export function toPublicUser(row) {
  return {
    id: row.id,
    name: row.name,
    avatarUrl: row.avatar_url,
    schoolShortName: row.school_short_name,
    verifiedStudent: Boolean(row.verified_student),
  };
}

export function toProduct(row) {
  return {
    id: row.id,
    schoolId: row.school_id,
    sellerId: row.seller_id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    usageType: row.usage_type,
    condition: row.condition_value,
    status: row.status,
    location: row.location,
    negotiable: Boolean(row.negotiable),
    isCourseRelated: Boolean(row.is_course_related),
    courseCodes: row.course_codes ? String(row.course_codes).split(",").filter(Boolean) : [],
    imageUrl: row.image_url,
    seller: {
      id: row.seller_id,
      name: row.seller_name,
      schoolShortName: row.school_short_name,
      verifiedStudent: Boolean(row.seller_verified_student),
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function normalizeCourseCode(code) {
  return String(code ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

export function displayCourseCode(code) {
  const normalized = normalizeCourseCode(code);
  const match = normalized.match(/^([A-Z]+)(\d.*)$/);
  return match ? `${match[1]} ${match[2]}` : normalized;
}
