import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { courses as mockCourses, products } from "../data/mockData.js";
import { listCourses } from "../lib/api.js";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [query, setQuery] = useState("");
  useEffect(() => {
    listCourses({ schoolId: "school_uta", q: query })
      .then((response) => setCourses(response.data))
      .catch(() => setCourses(mockCourses));
  }, [query]);
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold text-mav">Course Items</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Find supplies by course</h1>
      </div>
      <div className="mb-6 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
        <Search size={20} className="text-steel" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent py-1 focus:outline-none" placeholder="Search CSE 3442, PHYS 1444..." />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {courses.map((course) => {
          const count = products.filter((product) => product.courseCodes.includes(course.courseCode)).length;
          return (
            <Link key={course.id} to={`/courses/${encodeURIComponent(course.courseCode)}`} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:shadow-soft">
              <p className="font-bold text-ink">{course.courseCode}</p>
              <p className="mt-1 text-sm text-steel">{course.courseName}</p>
              <p className="mt-4 text-sm font-semibold text-mav">{count} listings</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
