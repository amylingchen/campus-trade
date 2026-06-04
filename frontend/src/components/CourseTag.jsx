import { Link } from "react-router-dom";

export default function CourseTag({ code }) {
  return (
    <Link to={`/courses/${encodeURIComponent(code)}`} className="rounded-full bg-mav/10 px-2.5 py-1 text-xs font-semibold text-mav">
      {code}
    </Link>
  );
}
