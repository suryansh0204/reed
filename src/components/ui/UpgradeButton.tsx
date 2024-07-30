"use client";

import { trpc } from "@/app/_trpc/client";
import { Button } from "./button";

const UpgradeButton = () => {
  //using api route from the stripe session in the index.ts
  const { mutate: createStripeSession } = trpc.createStripeSession.useMutation({
    onSuccess: ({ url }) => {
      window.location.href = url ?? "/dashboard/billing";
    },
  });
  return (
    <Button onClick={() => createStripeSession()} className="w-full">
      Upgrade now
    </Button>
  );
};

export default UpgradeButton;
