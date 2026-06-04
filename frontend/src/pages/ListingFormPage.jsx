import { useNavigate, useParams } from "react-router-dom";
import ListingForm from "../components/ListingForm.jsx";
import { products } from "../data/mockData.js";
import { schools as mockSchools } from "../data/mockData.js";
import { createProduct, listSchools, updateProduct, uploadProductImage } from "../lib/api.js";
import { getStoredUser } from "../lib/session.js";
import { useEffect, useState } from "react";

export default function ListingFormPage({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getStoredUser();
  const product = products.find((item) => item.id === id);
  const [schools, setSchools] = useState(mockSchools);
  const school = schools.find((item) => item.id === user?.schoolId) ?? schools[0];

  useEffect(() => {
    listSchools().then((response) => setSchools(response.data)).catch(() => {});
  }, []);

  const handleSubmit = async (event, selectedFile) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    let imageUrl = product?.imageUrl;

    if (selectedFile) {
      const upload = await uploadProductImage(selectedFile);
      imageUrl = upload.data.imageUrl;
    }

    const payload = {
      title: formData.get("title"),
      schoolId: formData.get("schoolId"),
      description: formData.get("description"),
      price: Number(formData.get("price")),
      category: formData.get("category"),
      usageType: formData.get("usageType"),
      condition: formData.get("condition"),
      location: formData.get("location"),
      negotiable: formData.get("negotiable") === "on",
      isCourseRelated: formData.get("isCourseRelated") === "on",
      courseCodes: String(formData.get("courseCodes") ?? "")
        .split(",")
        .map((code) => code.trim())
        .filter(Boolean),
      images: imageUrl ? [{ imageUrl, sortOrder: 1 }] : [],
    };

    if (mode === "edit" && product) {
      await updateProduct(product.id, payload);
      navigate(`/listings/${product.id}`);
      return;
    }

    const created = await createProduct(payload);
    navigate(`/listings/${created.data.id}`);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold text-mav">{user?.verifiedStudent ? "Verified seller" : "Verification needed"}</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">{mode === "edit" ? "Edit listing" : "Sell an item"}</h1>
      </div>
      <ListingForm initialProduct={mode === "edit" ? product : null} onSubmit={handleSubmit} school={school} />
    </div>
  );
}
