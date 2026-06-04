import { ImagePlus, UploadCloud, X } from "lucide-react";
import { useEffect, useState } from "react";
import { categoryLabels, conditionLabels, usageLabels } from "../data/mockData.js";

export default function ListingForm({ initialProduct, onSubmit, school }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(initialProduct?.imageUrl ?? "");

  useEffect(() => {
    if (!selectedFile) return undefined;
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  return (
    <form className="space-y-5 rounded-lg border border-slate-200 bg-white p-5" onSubmit={(event) => onSubmit(event, selectedFile)}>
      <div className="grid gap-5 md:grid-cols-2">
        {school && (
          <div className="md:col-span-2">
            <label htmlFor="listing-school" className="text-sm font-semibold text-ink">School</label>
            <input id="listing-school" className="mt-2 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-steel" value={`${school.shortName} - ${school.name}`} readOnly />
            <input type="hidden" name="schoolId" value={school.id} />
            <p className="mt-2 text-sm text-steel">Student listings are posted to your verified school community.</p>
          </div>
        )}
        <div className="md:col-span-2">
          <label htmlFor="listing-title" className="text-sm font-semibold text-ink">Title</label>
          <input id="listing-title" name="title" defaultValue={initialProduct?.title} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring" placeholder="Raspberry Pi 4 Kit" required />
        </div>
        <div>
          <label htmlFor="listing-price" className="text-sm font-semibold text-ink">Price</label>
          <input id="listing-price" name="price" type="number" min="0" defaultValue={initialProduct?.price} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring" placeholder="45" required />
        </div>
        <div>
          <label htmlFor="listing-location" className="text-sm font-semibold text-ink">Pickup location</label>
          <input id="listing-location" name="location" defaultValue={initialProduct?.location} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring" placeholder="Central Library" required />
        </div>
        <div>
          <label htmlFor="listing-category" className="text-sm font-semibold text-ink">Category</label>
          <select id="listing-category" name="category" defaultValue={initialProduct?.category ?? "course_materials"} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring">
            {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="listing-condition" className="text-sm font-semibold text-ink">Condition</label>
          <select id="listing-condition" name="condition" defaultValue={initialProduct?.condition ?? "good"} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring">
            {Object.entries(conditionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="listing-usage-type" className="text-sm font-semibold text-ink">Usage type</label>
          <select id="listing-usage-type" name="usageType" defaultValue={initialProduct?.usageType ?? "personal_sale"} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring">
            {Object.entries(usageLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="listing-course-codes" className="text-sm font-semibold text-ink">Course codes</label>
          <input id="listing-course-codes" name="courseCodes" defaultValue={initialProduct?.courseCodes?.join(", ")} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring" placeholder="CSE 3442, PHYS 1444" />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-semibold text-ink">Photos</label>
          <div className="mt-2 grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              {previewUrl ? (
                <img src={previewUrl} alt="Selected product preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-steel">
                  <ImagePlus size={28} />
                  <span className="text-sm font-medium">No photo selected</span>
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <label htmlFor="listing-image" className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-mav px-4 py-2 text-sm font-semibold text-white focus-ring">
                  <UploadCloud size={17} />
                  Choose image
                  <input id="listing-image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={handleFileChange} />
                </label>
                {selectedFile && (
                  <button type="button" className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-ink" onClick={() => { setSelectedFile(null); setPreviewUrl(initialProduct?.imageUrl ?? ""); }}>
                    <X size={16} />
                    Remove
                  </button>
                )}
              </div>
              <p className="mt-3 text-sm text-steel">
                Upload JPG, PNG, WebP, or GIF. Max 5MB. The backend endpoint is ready at <span className="font-mono">POST /api/uploads</span>.
              </p>
              {selectedFile && (
                <input type="hidden" name="imageFileName" value={selectedFile.name} />
              )}
            </div>
          </div>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="listing-description" className="text-sm font-semibold text-ink">Description</label>
          <textarea id="listing-description" name="description" defaultValue={initialProduct?.description} className="mt-2 min-h-32 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring" required />
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-steel">
          <input name="negotiable" type="checkbox" defaultChecked={initialProduct?.negotiable} />
          Negotiable
        </label>
        <label className="flex items-center gap-2 text-sm text-steel">
          <input name="isCourseRelated" type="checkbox" defaultChecked={initialProduct?.isCourseRelated} />
          Course related
        </label>
      </div>
      <input type="hidden" name="selectedImageFile" value={selectedFile?.name ?? ""} />
      <button className="rounded-md bg-mav px-4 py-2 text-sm font-semibold text-white focus-ring">
        {initialProduct ? "Save changes" : "Publish listing"}
      </button>
    </form>
  );
}
