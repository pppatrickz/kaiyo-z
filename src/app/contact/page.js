'use client'
import { useEffect, useState } from "react";
import Contact from "../_components/sections/Contact";
import PumaBottomImage from "../_components/deco/PumaBottomImage";


export default function Page() {

  return (
      <div className="sticky top-0 min-h-screen z-20 bg-[var(--background)] bg-paper">
      <Contact />
      <PumaBottomImage/>
      </div>
  );
}