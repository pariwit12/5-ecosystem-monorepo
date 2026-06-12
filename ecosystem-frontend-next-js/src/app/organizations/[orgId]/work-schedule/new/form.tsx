// "use client";

// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useRouter } from "next/navigation";
// import { useCreateWorkSchedulePlace } from "@/features/work-schedule/places/hooks/use-create-work-schedule-place";

// // 🌟 Import Schema จากที่หลังบ้านและหน้าบ้านแชร์ร่วมกัน
// import {
//   CreateWorkSchedulePlaceDtoBodySchema,
//   CreateWorkSchedulePlaceDtoBody,
// } from "@backend/modules/work-schedule/places/commands/create-work-schedule-place.command";

// // ดึง Timezone ทั้งหมด และหา Timezone ปัจจุบันของเครื่อง
// const allTimezones = Intl.supportedValuesOf("timeZone");
// const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// export const CreateWorkSchedulePlaceForm = ({ orgId }: { orgId: string }) => {
//   const router = useRouter();
//   const { mutate: createPlace, isPending } = useCreateWorkSchedulePlace();

//   // 🌟 ผูก React Hook Form เข้ากับ Zod Schema
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<CreateWorkSchedulePlaceDtoBody>({
//     resolver: zodResolver(CreateWorkSchedulePlaceDtoBodySchema),
//     defaultValues: {
//       name: "",
//       timezone: defaultTimezone, // ดึงค่าเริ่มต้นเป็น Timezone ของเครื่องผู้ใช้
//     },
//   });

//   const onSubmit = (data: CreateWorkSchedulePlaceDtoBody) => {
//     createPlace(
//       { orgId, body: data },
//       {
//         onSuccess: () => {
//           // ถ้าสำเร็จให้เตะกลับไปหน้ารวม
//           router.push(`/organizations/${orgId}/work-schedule`);
//         },
//         onError: (error: any) => {
//           // ถ้ามี Global Error Modal ของ axios interceptor จัดการแล้ว อาจไม่ต้องทำอะไรเพิ่มตรงนี้
//           console.error("Failed to create place:", error);
//         },
//       },
//     );
//   };

//   return (
//     <form
//       onSubmit={handleSubmit(onSubmit)}
//       className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col gap-6"
//     >
//       {/* 🟢 ชื่อสถานที่ทำงาน */}
//       <div className="flex flex-col gap-2">
//         <label htmlFor="name" className="text-sm font-bold text-gray-700">
//           ชื่อสถานที่ทำงาน <span className="text-red-500">*</span>
//         </label>
//         <input
//           id="name"
//           type="text"
//           {...register("name")} // 🌟 ผูก input เข้ากับ RHF
//           placeholder="เช่น วอร์ดผู้ป่วยใน ชั้น 3, คลินิกสาขาอารีย์"
//           disabled={isPending}
//           className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-gray-50 focus:ring-2 ${
//             errors.name
//               ? "border-red-300 focus:ring-red-100 focus:border-red-500"
//               : "border-gray-300 focus:ring-purple-100 focus:border-purple-500"
//           }`}
//         />
//         {/* แสดง Error จาก Zod */}
//         {errors.name && (
//           <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
//         )}
//       </div>

//       {/* 🟢 เขตเวลา (Timezone) */}
//       <div className="flex flex-col gap-2">
//         <label htmlFor="timezone" className="text-sm font-bold text-gray-700">
//           เขตเวลา (Timezone) <span className="text-red-500">*</span>
//         </label>
//         <select
//           id="timezone"
//           {...register("timezone")} // 🌟 ผูก select เข้ากับ RHF
//           disabled={isPending}
//           className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-gray-50 bg-white focus:ring-2 ${
//             errors.timezone
//               ? "border-red-300 focus:ring-red-100 focus:border-red-500"
//               : "border-gray-300 focus:ring-purple-100 focus:border-purple-500"
//           }`}
//         >
//           {allTimezones.map((tz) => (
//             <option key={tz} value={tz}>
//               {tz}
//             </option>
//           ))}
//         </select>
//         {errors.timezone && (
//           <p className="text-sm text-red-500 mt-1">{errors.timezone.message}</p>
//         )}
//         <p className="text-xs text-gray-500">
//           เวลามาตรฐานที่จะถูกใช้ในการคำนวณและแสดงผลตารางกะการทำงานทั้งหมดในสถานที่นี้
//         </p>
//       </div>

//       {/* 🟢 ปุ่ม Action */}
//       <div className="border-t pt-6 mt-2 flex justify-end gap-3">
//         <button
//           type="button"
//           onClick={() => router.back()}
//           disabled={isPending}
//           className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-all"
//         >
//           ยกเลิก
//         </button>
//         <button
//           type="submit"
//           disabled={isPending}
//           className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
//         >
//           {isPending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
//         </button>
//       </div>
//     </form>
//   );
// };
