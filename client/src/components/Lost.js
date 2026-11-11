import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver, Modal, Button, Input, Select, Textarea, reportCategories, submitReport, useLostFoundStore, useUserStore, useAccountRecords, filterReports, getReports, reportStatuses, PageContainer, PageHeader, SearchBar, Badge, EmptyState, cn } from "./Shared.js";
import { ImagePlus, CalendarDays, Lock, Plus, PackageSearch } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo } from "react";
/** What the browser may hand us. `accept` on the input is only a hint — it
 *  filters the picker, it does not stop a drop or a crafted File object. */
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 1_500_000;
// Every field is bounded. A minimum keeps the report useful; a maximum keeps a
// paste of an entire document from being stored and rendered back. The image is
// a base64 data URL, so its character ceiling is above the byte ceiling.
function schemaFor(kind) {
  return z.object({
    itemName: z.string().min(3, "Describe the item (min 3 characters)").max(80, "Keep the item name under 80 characters"),
    category: z.enum(reportCategories, {
      error: "Pick a category"
    }),
    description: z.string().min(10, "Add a short description (min 10 characters)").max(600, "Keep the description under 600 characters"),
    location: z.string().min(3, "Where was it lost/found?").max(80, "Keep the location under 80 characters"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
    contact: (kind === "lost" ? z.string().min(5, "How can we reach you?") : z.string()).max(120, "Keep this under 120 characters").optional(),
    image: z.string().max(MAX_IMAGE_BYTES * 2).optional()
  });
}
function ReportFormModal({
  kind,
  open,
  onClose
}) {
  const addReport = useLostFoundStore(s => s.addReport);
  const user = useUserStore(s => s.user);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors
    },
    setValue
  } = useForm({
    resolver: zodResolver(schemaFor(kind)),
    defaultValues: {
      category: "Electronics",
      date: new Date().toISOString().slice(0, 10)
    }
  });
  const close = () => {
    reset();
    setPreview(null);
    onClose();
  };
  const onSubmit = async values => {
    setSubmitting(true);
    try {
      const report = await submitReport({
        kind,
        itemName: values.itemName,
        category: values.category,
        description: values.description,
        location: values.location,
        date: values.date,
        contact: values.contact,
        imageUrl: preview ?? undefined,
        ownerSub: user?.sub
      });
      addReport(report);
      toast.success(kind === "lost" ? "Lost item report submitted." : "Found item report submitted.");
      close();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };
  const onImage = file => {
    if (!file) return;
    // Check the real MIME type, not just the extension, and do it before the
    // file is read into memory. The server (or the storage bucket policy) is the
    // final authority; this is the first of the two gates.
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Please pick a PNG, JPEG, WebP or GIF image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Please pick an image under 1.5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      // readAsDataURL always yields a string; the union exists for readAsArrayBuffer.
      const dataUrl = typeof reader.result === "string" ? reader.result : null;
      if (!dataUrl) return;
      setPreview(dataUrl);
      setValue("image", dataUrl);
    };
    reader.readAsDataURL(file);
  };
  return <Modal open={open} onClose={close} size="lg" title={kind === "lost" ? "Report a Lost Item" : "Report a Found Item"} footer={<>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button loading={submitting} onClick={handleSubmit(onSubmit)}>
            Submit Report
          </Button>
        </>}>
      <form onSubmit={e => {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }} className="space-y-3">
        <p className="rounded-lg bg-surface px-3 py-2 text-[11.5px] text-secondary">
          Describe the item and where you last saw it.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Item name" placeholder="e.g., Black laptop sleeve" error={errors.itemName?.message} {...register("itemName")} />
          <Select label="Category" error={errors.category?.message} {...register("category")}>
            {reportCategories.map(c => <option key={c} value={c}>
                {c}
              </option>)}
          </Select>
        </div>

        <Textarea label="Description" placeholder="Color, brand, distinguishing marks…" error={errors.description?.message} {...register("description")} />

        <div className="grid gap-3 sm:grid-cols-2">
          <Input label={kind === "lost" ? "Last known location" : "Found location"} placeholder="e.g., Departures, Gate A2" error={errors.location?.message} {...register("location")} />
          <Input label={kind === "lost" ? "Date lost" : "Date found"} type="date" error={errors.date?.message} {...register("date")} />
        </div>

        {kind === "lost" && <Input label="Contact information" placeholder="email or phone (private)" hint="Reports and contact details stay in this browser. Nothing is sent to an airport." error={errors.contact?.message} {...register("contact")} />}

        <div className="flex items-center gap-3">
          <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line text-muted hover:border-primary hover:text-primary focus-ring">
            {preview ? <img src={preview} alt="Attachment preview" className="h-full w-full rounded-xl object-cover" /> : <>
                <ImagePlus className="h-4 w-4" />
                <span className="mt-0.5 text-[9px]">Image</span>
              </>}
            <input type="file" accept="image/*" className="sr-only" onChange={e => onImage(e.target.files?.[0])} />
          </label>
          <p className="text-[11.5px] text-muted">
            Add an optional photo to help identify the item. This report stays in your browser.
          </p>
        </div>
      </form>
    </Modal>;
}
const STATUS_TONE = {
  Submitted: 'info',
  'Under Review': 'warning',
  'Potential Match': 'purple',
  Resolved: 'success',
  Closed: 'neutral'
};
function ReportCard({
  report,
  onOpen
}) {
  return <button onClick={onOpen} className="card group p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-pop focus-ring">
      <div className="flex items-start justify-between gap-2">
        <span className={cn('rounded-md border px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide', report.kind === 'lost' ? 'tone-danger' : 'tone-success')}>
          {report.kind}
        </span>
        <Badge tone={STATUS_TONE[report.status]}>{report.status}</Badge>
      </div>
      <h2 className="mt-2 truncate text-[13.5px] font-semibold text-ink">{report.itemName}</h2>
      <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-secondary">{report.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
        <span className="rounded-md bg-surface px-1.5 py-0.5 text-primary">{report.category}</span>
        <span className="flex min-w-0 items-center gap-1">
          <CalendarDays className="h-3 w-3 shrink-0" /> <span className="truncate">{report.date}</span>
        </span>
        <span className="min-w-0 truncate">{report.location}</span>
      </div>
    </button>;
}
function LostAndFoundPage() {
  const serverReports = useAccountRecords(s => s.reports);
  const {
    query,
    category,
    status,
    setQuery,
    setCategory,
    setStatus,
    clearFilters,
    reports: ownReports
  } = useLostFoundStore();
  const user = useUserStore(s => s.user);
  const [formKind, setFormKind] = useState(null);
  const [selected, setSelected] = useState(null);
  const all = useMemo(() => {
    const unique = new Map();
    [...serverReports, ...ownReports, ...getReports()].forEach(report => {
      if (!unique.has(report.id)) unique.set(report.id, report);
    });
    return [...unique.values()];
  }, [ownReports, serverReports]);
  const filtered = useMemo(() => filterReports(all, {
    query,
    category: category,
    status: status
  }), [all, query, category, status]);
  const selectedIsMine = !!selected && !!user && selected.ownerSub === user.sub;
  return <PageContainer className="py-4 sm:py-6">
      <PageHeader title="Lost & Found" subtitle="Search reports or add your own" actions={<>
            <Button size="sm" variant="outline" onClick={() => setFormKind('found')}>
              <Plus className="h-3.5 w-3.5" /> Report Found Item
            </Button>
            <Button size="sm" onClick={() => setFormKind('lost')}>
              <Plus className="h-3.5 w-3.5" /> Report Lost Item
            </Button>
          </>} />

      {/* Filters */}
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchBar value={query} onChange={setQuery} placeholder="Search items or places…" label="Search lost and found reports" className="w-full lg:w-[320px]" />
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {['All', ...reportCategories].map(c => <button key={c} onClick={() => setCategory(c)} aria-pressed={category === c} className={cn('whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-colors focus-ring', category === c ? 'border-primary bg-primary text-on-primary' : 'border-line bg-card text-secondary hover:border-primary hover:text-primary')}>
              {c}
            </button>)}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-[11.5px] text-muted">Status:</span>
        {['All', ...reportStatuses].map(s => <button key={s} onClick={() => setStatus(s)} aria-pressed={status === s} className={cn('rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors focus-ring', status === s ? 'border-primary bg-surface text-primary' : 'border-line text-secondary hover:border-primary hover:text-primary')}>
            {s}
          </button>)}
        {(query || category !== 'All' || status !== 'All') && <button onClick={clearFilters} className="ml-1 text-[11.5px] font-medium text-danger hover:underline">
            Clear All
          </button>}
        <span className="ml-auto text-[11.5px] text-muted">{filtered.length} report(s)</span>
      </div>

      {/* List */}
      {filtered.length === 0 ? <EmptyState icon={<PackageSearch className="h-5 w-5" />} title="No reports match your filters" description="Try different keywords, or be the first to submit a report for this category." className="mt-4" action={<div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={clearFilters}>
                Reset filters
              </Button>
              <Button size="sm" onClick={() => setFormKind('lost')}>
                Report Lost Item
              </Button>
            </div>} /> : <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(r => <ReportCard key={r.id} report={r} onOpen={() => setSelected(r)} />)}
        </div>}



      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.itemName} size="md" footer={<>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Close
            </Button>
            {selectedIsMine && <Badge tone="success">Your report</Badge>}
          </>}>
        {selected && <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={STATUS_TONE[selected.status]}>{selected.status}</Badge>
              <Badge tone="neutral">{selected.category}</Badge>
              <span className={cn('rounded-md border px-1.5 py-0.5 text-[10.5px] font-bold uppercase', selected.kind === 'lost' ? 'tone-danger' : 'tone-success')}>
                {selected.kind} item
              </span>
            </div>

            <p className="text-[13px] leading-relaxed text-secondary">{selected.description}</p>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl bg-surface px-3 py-2.5">
                <p className="text-[11px] text-muted">Location</p>
                <p className="text-[12.5px] font-medium text-ink">{selected.location}</p>
              </div>
              <div className="rounded-xl bg-surface px-3 py-2.5">
                <p className="text-[11px] text-muted">Date</p>
                <p className="text-[12.5px] font-medium text-ink">
                  {selected.date}
                  {selected.time ? ` · ${selected.time}` : ''}
                </p>
              </div>
            </div>

            {selected.storage && <div className="rounded-xl bg-surface px-3 py-2.5">
                <p className="text-[11px] text-muted">Storage / handover</p>
                <p className="text-[12.5px] font-medium text-ink">{selected.storage}</p>
              </div>}

            <div className="flex items-start gap-2 rounded-xl border border-line px-3 py-2.5 text-[12px] text-secondary">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
              {selectedIsMine && selected.contact ? <span>
                  Your contact details: <span className="font-medium text-ink">{selected.contact}</span>
                </span> : <span>Contact details are kept private and are never shown in public listings.</span>}
            </div>

          </div>}
      </Modal>

      <ReportFormModal kind={formKind ?? 'lost'} open={!!formKind} onClose={() => setFormKind(null)} />
    </PageContainer>;
}
export { ReportFormModal, LostAndFoundPage };
export default LostAndFoundPage;
