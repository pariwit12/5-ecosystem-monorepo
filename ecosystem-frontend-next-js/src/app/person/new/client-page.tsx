// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { toast } from "sonner";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";
import { USER_ERROR_MESSAGES } from "@/constants/error-messages";

import { CreatePersonForm } from "@/features/person/components/create-person-form";

function ToastNotifier() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorCode = searchParams.get("error");

    if (!errorCode) return;

    if (errorCode === ErrorCode.PERSON_NOT_FOUND) {
      const errorMessage = USER_ERROR_MESSAGES[errorCode];

      toast.error("ไม่สามารถเข้าถึงข้อมูลได้", {
        description: errorMessage,
      });
    }

    window.history.replaceState(null, "", window.location.pathname);
  }, [searchParams]);

  return null;
}

export default function PersonNewClient() {
  return (
    <>
      {/* ===================================== */}
      {/* Toast สำหรับ Error ที่มาพร้อมกับ URL */}
      {/* ===================================== */}

      <Suspense fallback={null}>
        <ToastNotifier />
      </Suspense>

      {/* ========================================================================================== */}
      {/* Main UI (children) */}
      {/* ========================================================================================== */}

      <div className="p-8 w-full max-w-6xl mx-auto flex flex-col gap-8">
        {/*  */}
        {/* ============================== */}
        {/* ส่วนหัวข้อ + สถานะ fetching */}
        {/* ============================== */}

        <div>
          {/*  */}
          {/* =================================================================== */}
          {/* 🟢 ปุ่มย้อนกลับ (ซ้ายสุด), ส่วนหัวข้อ (กลาง) และ ปุ่มแก้ไขข้อมูล (ขวาสุด) */}
          {/* =================================================================== */}

          <div className="flex items-center gap-4 border-b pb-6">
            {/*  */}
            {/* ========================== */}
            {/* 🟢 ปุ่มย้อนกลับ (ซ้ายสุด) */}
            {/* ========================== */}

            <Link
              href={`/`}
              className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>

            {/* ========================== */}
            {/* 🟢 (จบ) ปุ่มย้อนกลับ (ซ้ายสุด) */}
            {/* ========================== */}

            {/* ============================================ */}
            {/* 🟢 ส่วนหัวข้อ (ซ้าย) และ ปุ่มแก้ไขข้อมูล (ขวา) */}
            {/* ============================================ */}

            <div className="flex-1 flex items-center justify-between">
              {/*  */}
              {/* ============================= */}
              {/* 🟢 กลุ่มของส่วนหัวข้อ (ซ้าย) */}
              {/* ============================= */}

              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  สร้างบัญชีผู้ใช้งาน
                </h2>

                <p className="text-gray-500 mt-1 font-mono text-sm">
                  บันทึกเพื่อดำเนินการต่อ
                </p>
              </div>

              {/* ============================= */}
              {/* 🟢 (จบ) กลุ่มของส่วนหัวข้อ (ซ้าย) */}
              {/* ============================= */}
              {/*  */}
            </div>

            {/* ============================================ */}
            {/* 🟢 (จบ) ส่วนหัวข้อ (ซ้าย) และ ปุ่มแก้ไขข้อมูล (ขวา) */}
            {/* ============================================ */}
            {/*  */}
          </div>

          {/* =================================================================== */}
          {/* 🟢 (จบ) ปุ่มย้อนกลับ (ซ้ายสุด), ส่วนหัวข้อ (กลาง) และ ปุ่มแก้ไขข้อมูล (ขวาสุด) */}
          {/* =================================================================== */}
          {/*  */}
        </div>

        {/* ============================== */}
        {/* (จบ) ส่วนหัวข้อ + สถานะ fetching */}
        {/* ============================== */}

        {/* ============================ */}
        {/* 🌟 เนื้อหาหลักตรงนี้ */}
        {/* ============================ */}

        {/* ===================== */}
        {/* ส่วนแสดงผล: Form */}
        {/* ===================== */}

        <CreatePersonForm className="" />

        {/* ===================== */}
        {/* (จบ) ส่วนแสดงผล: Form */}
        {/* ===================== */}

        {/* ============================ */}
        {/* 🌟 (จบ) เนื้อหาหลักตรงนี้ */}
        {/* ============================ */}
        {/*  */}
      </div>

      {/* ========================================================================================== */}
      {/* (จบ) Main UI (children) */}
      {/* ========================================================================================== */}
    </>
  );
}
