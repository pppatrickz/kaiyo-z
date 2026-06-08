"use client";
import { useState } from "react";
import { useLang } from "@/app/_lib/langContext";
import contactData from "@/app/_data/contact.json";

export default function Contact() {
  const { lang } = useLang();
  const t = contactData[lang]; // 取得對應語言字串

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [emailError, setEmailError] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "email") setEmailError(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setEmailError(true);
      setStatus("error");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch(
        "https://script.google.com/macros/s/AKfycbz2rd0EB0WTN1vvJ7vYCTQ_wnDBIdaE-fXtOfuezl7cCEsJ3fYOALgTJt0DqFlhZq0Y/exec" +
          "?origin=" +
          encodeURIComponent(window.location.origin),
        {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(form),
        }
      );

      const result = await res.json();
      if (result.status === "success") {
        setStatus("success");
        setForm({ name: "", email: "", message: "" });
      } else {
        throw new Error(result.message || "API error");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-repeat flex flex-col">
      {/* Header */}
      <header className="text-center mt-24">
        <h1 className="text-4xl font-bold">{t.title}</h1>
      </header>

      {/* Form */}
      <div className="flex-grow flex items-center justify-center p-6">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-lg bg-white/80 p-6 rounded-[21px] shadow-md"
        >
          <label className="block mt-4 font-semibold">{t.name}</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />

          <label className="block mt-4 font-semibold">{t.email}</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className={`w-full p-2 border rounded transition ${
              emailError ? "border-red-500 animate-shake" : ""
            }`}
          />

          <label className="block mt-4 font-semibold">{t.message}</label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            rows="5"
            required
            className="w-full p-2 border rounded"
          />

          <button
            type="submit"
            disabled={status === "loading"}
            className="mt-6 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-600"
          >
            {status === "loading" ? t.sending : t.submit}
          </button>

          {status === "success" && (
            <p className="mt-4 text-green-600">{t.success}</p>
          )}
          {status === "error" && !emailError && (
            <p className="mt-4 text-red-600">{t.error}</p>
          )}
          {emailError && <p className="mt-2 text-red-600">{t.emailError}</p>}
        </form>
      </div>
    </div>
  );
}
