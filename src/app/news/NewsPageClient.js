'use client'
import { useEffect, useState } from "react";
import News from "@/app/_components/sections/News";

export default function Page() {

  return (
      <div className="sticky top-0 min-h-screen z-20 bg-white bg-paper">
           <News/>
      </div>
  );
}