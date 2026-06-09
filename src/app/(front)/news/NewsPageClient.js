// src/app/news/page.js
'use client'
import News from "@/app/_components/sections/News";
import { useEffect, useState } from "react";

export default function Page() {
  return (
    <div className="relative min-h-screen bg-[#FAFAFA] bg-paper">
      <News />
    </div>
  );
}