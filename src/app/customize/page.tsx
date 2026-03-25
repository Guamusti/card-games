"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CustomizePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/shop");
  }, [router]);
  return null;
}
