import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StandardListPage from "@/components/StandardListPage";


// ─── Column definitions ───────────────────────────────────────────────────────
const COLUMNS = [
  { key: "name",   label: "Wholesaler", type: "text", width: "col-span-3" },
  { key: "gst_no", label: "GST No",     type: "text", width: "col-span-2" },
  { key: "phone",  label: "Phone",      type: "text", width: "col-span-2" },
  { key: "city",   label: "City",       type: "text", width: "col-span-1" },
];

// ─── GST badge ────────────────────────────────────────────────────────────────
function GstBadge({ gst }) {
  return gst ? (
    <span className="font-mono text-xs text-gray-700">{gst}</span>
  ) : (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      N/A
    </span>
  );
}

// ─── Desktop row ──────────────────────────────────────────────────────────────
function DesktopRow({ item, absoluteIndex, onViewDetails }) {
  return (
    <div className="grid grid-cols-10 gap-2 p-4 items-center text-sm">
      <div className="col-span-1 text-center text-gray-500">
        {absoluteIndex + 1}
      </div>
      <div className="col-span-3 font-medium text-gray-800 truncate">
        {item.name}
      </div>
      <div className="col-span-2 truncate">
        <GstBadge gst={item.gst_no} />
      </div>
      <div className="col-span-2 text-gray-600">
        {item.phone ?? "—"}
      </div>
      <div className="col-span-1 text-gray-600 truncate">
        {item.city ?? "—"}
      </div>
      <div className="col-span-1 text-center">
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs rounded"
          onClick={(e) => { e.stopPropagation(); onViewDetails(item.id); }}
        >
          View
        </Button>
      </div>
    </div>
  );
}

// ─── Mobile card ─────────────────────────────────────────────────────────────
function MobileCard({ item, onViewDetails }) {
  return (
    <div className="p-4 space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-gray-800 text-sm">{item.name}</h3>
          <p className="text-xs text-gray-500">{item.city ?? "—"}</p>
        </div>
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs rounded ml-2"
          onClick={(e) => { e.stopPropagation(); onViewDetails(item.id); }}
        >
          View
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-1 text-xs">
        <div>
          <span className="text-gray-500">GST: </span>
          <GstBadge gst={item.gst_no} />
        </div>
        <div>
          <span className="text-gray-500">Phone: </span>
          <span className="font-medium">{item.phone ?? "—"}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WholesalerReportPage() {
  const navigate = useNavigate();
  const goToDetails = (id) => navigate(`/report/Wholesaler/${id}`);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => navigate("/report/wholesaler/add")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Add New Wholesaler
        </Button>
      </div>
      <StandardListPage
        title="Wholesaler Reports"
        fetchEndpoint="/v1/api/admin/contact/search"
        suggestEndpoint="/v1/api/admin/contact/suggestions"
        searchPlaceholder="Search wholesalers... (Enter to search, Shift+Enter to focus)"
        exportTable="wholesaler_reports"
        columns={COLUMNS}
        mapSuggestion={(s) => {
          const name = s?.name ?? "";
          const gst = s?.gst_no ? `(${s.gst_no})` : "(N/A)";
          return {
            id: s?.id,
            value: name,
            label: `${name} ${gst}`,
            secondary: s?.email ?? "",
          };
        }}
        // Tell the layout how to unpack this API's specific response shape:
        //   { status, count, data: { wholesalers: [...] } }
        dataExtractor={(res) => res.data?.wholesalers ?? []}
        totalExtractor={(res) => res.count ?? res.data?.wholesalers?.length ?? 0}
        renderRow={(item, _i, absIdx) => (
          <DesktopRow item={item} absoluteIndex={absIdx} onViewDetails={goToDetails} />
        )}
        renderMobileRow={(item) => (
          <MobileCard item={item} onViewDetails={goToDetails} />
        )}
        
      />
    </div>
  );
}