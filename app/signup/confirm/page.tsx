import { Suspense } from "react";
import ActivationConfirmClient from "./ActivationConfirmClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white p-8">Loading...</div>}>
      <ActivationConfirmClient />
    </Suspense>
  );
}
