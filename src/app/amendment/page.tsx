"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Suspense } from "react";
import {
  initiateAmendment,
  createAmendment,
  amendmentRecord,
  acceptAmendment,
  cancelAmendment,
} from "@/lib/api";
function AmendmentPageContent() {
  const params = useSearchParams();
  const router = useRouter();

  const bookingCode = params.get("bookingCode") || "";

  const [loading, setLoading] = useState(true);

  const [initiateData, setInitiateData] = useState<any>(null);

  const [selectedType, setSelectedType] =
    useState("");

  const [amendmentId, setAmendmentId] =
    useState("");

  const [record, setRecord] =
    useState<any>(null);

  const [creating, setCreating] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadInitiate();
  }, []);

  async function loadInitiate() {
    try {
      const res = await initiateAmendment(
        bookingCode
      );

      console.log(res);

      setInitiateData(res.data);
    } catch (err: any) {
      console.error(err);
    
      toast.error(
        err?.response?.data?.message ??
        "Failed to initiate amendment."
      );
    } finally {
      setLoading(false);
    }
  }
  
  async function handleCreate() {
    if (!selectedType) {
      toast.warning("Please select an amendment type.");
      return;
    }
  
    if (!initiateData?.segs?.length || !initiateData?.trv?.length) {
      toast.error("Initiate amendment data not found.");
      return;
    }
  
    try {
      const seg = initiateData.segs[0];
      const pax = initiateData.trv[0];
  
      const payload = {
        bid: bookingCode,
  
        amtyp: selectedType,
  
        agrmk: "",
  
        ismen: false,
  
        trseg: [
          {
            seg: seg.id,
  
            oddt: "",
  
            nwdt: "",
  
            pax: {
              id: pax.id,
  
              onm: `${pax.pfx} ${pax.fnm} ${pax.lnm}`,
  
              ttl: "",
  
              fnm: "",
  
              lnm: "",
  
              doc: {},
  
              iswhl: false,
  
              isml: false,
  
              exbg: "",
            },
          },
        ],
      };
  
      console.log("CREATE AMENDMENT PAYLOAD");
      console.log(payload);
  
      const res = await createAmendment(payload);
  
      console.log("CREATE RESPONSE");
      console.log(res);
  
      const id = res.data?.code;
  
      if (!id) {
        toast.error("Amendment ID not received.");
        return;
      }
  
      setAmendmentId(id);
  
      const quotation = await amendmentRecord(id);
  
      console.log("AMENDMENT RECORD");
      console.log(quotation);
  
      setRecord(quotation);
  
      toast.success("Amendment created successfully.");
    } catch (err: any) {
      console.error(err);
    
      toast.error(
        err?.response?.data?.message ??
        "Failed to create amendment."
      );
    }
    finally {
      setCreating(false);
    }
  }
  async function handleAccept() {
    try {
      const res = await acceptAmendment(amendmentId);
  
      console.log(res);
  
      toast.success("Amendment accepted successfully.");
  
      setTimeout(() => {
        router.push("/my-bookings");
      }, 1500);
  
    } catch (err: any) {
      console.error(err);
    
      toast.error(
        err?.response?.data?.message ??
        "Accept failed."
      );
    }finally {
      setAccepting(false);
    }
  }

  async function handleCancel() {
    try {
      await cancelAmendment(
        amendmentId,
        "User Cancelled"
      );
  
      toast.success("Amendment cancelled successfully.");
  
      setTimeout(() => {
        router.push("/my-bookings");
      }, 1500);  
    } catch (err: any) {
      console.error(err);
    
      toast.error(
        err?.response?.data?.message ??
        "Cancellation failed."
      );
    }finally {
      setCancelling(false);
    }
  }

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center text-white bg-slate-900">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-900 text-white p-10">

      <div className="max-w-5xl mx-auto">

        <h1 className="text-4xl font-bold mb-8">
          Flight Amendment
        </h1>

        <div className="bg-slate-800 rounded-xl p-6">

          <h2 className="text-xl font-semibold mb-4">
            Booking
          </h2>

          <p>
            Booking Code:
            <b> {bookingCode}</b>
          </p>

          <hr className="my-6 border-slate-600"/>

          <h2 className="text-xl font-semibold mb-4">
            Available Amendment Types
          </h2>

          <div className="space-y-3">

            {initiateData?.amtyps?.map(
              (type: string) => (
                <label
                  key={type}
                  className="flex items-center gap-3"
                >
                  <input
                    type="radio"
                    name="type"
                    value={type}
                    checked={
                      selectedType === type
                    }
                    onChange={() =>
                      setSelectedType(type)
                    }
                  />

                  {type}
                </label>
              )
            )}

          </div>

          <button
  onClick={handleCreate}
  disabled={creating}
  className="mt-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl"
>
  {creating ? "Creating..." : "Create Amendment"}
</button>

        </div>

        {record && (

          <div className="bg-slate-800 rounded-xl p-6 mt-8">

<div className="grid md:grid-cols-2 gap-4">

<div className="bg-slate-700 rounded-xl p-4">
  <p className="text-gray-400">Amendment ID</p>
  <p className="font-semibold">{amendmentId}</p>
</div>

<div className="bg-slate-700 rounded-xl p-4">
  <p className="text-gray-400">Type</p>
  <p className="font-semibold">{selectedType}</p>
</div>

<div className="bg-slate-700 rounded-xl p-4">
  <p className="text-gray-400">Status</p>
  <p className="font-semibold">
    {record?.status ?? "-"}
  </p>
</div>

<div className="bg-slate-700 rounded-xl p-4">
  <p className="text-gray-400">Quotation Amount</p>
  <p className="font-semibold">
    ₹{record?.amount ?? "-"}
  </p>
</div>

</div>

            <div className="flex gap-4 mt-8">

            <button
  onClick={handleAccept}
  disabled={accepting}
  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl"
>
  {accepting ? "Accepting..." : "Accept Amendment"}
</button>

<button
  onClick={handleCancel}
  disabled={cancelling}
  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl"
>
  {cancelling ? "Cancelling..." : "Cancel Amendment"}
</button>
            </div>

          </div>

        )}

      </div>

    </div>
  );
}
export default function AmendmentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex justify-center items-center text-white bg-slate-900">
          Loading...
        </div>
      }
    >
      <AmendmentPageContent />
    </Suspense>
  );
}