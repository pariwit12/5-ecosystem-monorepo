import axios from "axios";
import { useErrorStore } from "@/store/use-error-store";

import { USER_ERROR_MESSAGES } from "@/constants/error-messages";

// 🌟 สอนให้ TypeScript รู้จัก Config พิเศษของเรา
declare module "axios" {
  export interface AxiosRequestConfig {
    skipErrorCodes?: readonly string[];
    retryCount?: number; // เอาไว้นับจำนวนครั้งที่ Retry
  }
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001",
  timeout: 5000, // 🌟 ตั้งเวลา Timeout ไว้ที่ 5 วินาที
});

apiClient.interceptors.response.use(
  (response) => response, // ถ้าสำเร็จ ปล่อยผ่านไป

  // เติม async เพราะเราจะใช้ await ในการหน่วงเวลา Retry
  async (error) => {
    const config = error.config;
    // 🛡️ ป้องกันกรณี Edge Case ที่ config หายไป (บางครั้ง Axios สร้าง Request ไม่สำเร็จตั้งแต่ต้น)
    if (!config) {
      return Promise.reject(error);
    }

    // ==========================================
    // 🔄 โซนที่ 1: ระบบ Auto-Retry (ดักจับก่อนเพื่อน)
    // ==========================================
    // 🌟 1. ดึง Method มาเช็ค และล็อกเป้าให้ทำ Auto-retry เฉพาะ GET เท่านั้น
    const isGetMethod = config.method?.toLowerCase() === "get";
    const isNetworkOrTimeout =
      error.code === "ECONNABORTED" || error.message === "Network Error";

    // 🌟 2. เพิ่มเงื่อนไข isGetMethod เข้าไปใน if
    // 🌟 ระบบ Auto-Retry (กรณี Timeout หรือเน็ตหลุด)
    // ถ้า Error เป็น Timeout และยัง Retry ไม่เกิน 2 ครั้ง
    if (
      isGetMethod &&
      isNetworkOrTimeout &&
      (!config.retryCount || config.retryCount < 2)
    ) {
      config.retryCount = (config.retryCount || 0) + 1;
      console.warn(
        `⏳ เซิร์ฟเวอร์ตอบสนองช้า... กำลังลองใหม่ครั้งที่ ${config.retryCount}`,
      );

      // หน่วงเวลา 1 วินาทีก่อนยิงซ้ำ (Backoff)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return apiClient(config); // ยิง API เดิมซ้ำ!
    }

    // ==========================================
    // 🚦 โซนที่ 3: แยกแยะ "3 กรณี" ตามหลักสถาปัตยกรรม
    // ==========================================
    // เตรียมฟังก์ชันเปิด Modal
    const { showError } = useErrorStore.getState();

    const status = error.response?.status; // วางไว้ข้างนอก เผื่อว่า error.response มาไม่เรียบร้อย แต่มี status มา

    if (error.response && error.response.data) {
      // 🎯 กรณีที่ 3: ยิงถึง Backend แล้ว แต่ Backend ตอบ Error กลับมา (มี JSON Uniform)
      const backendData = error.response.data;

      const backendMessage = backendData?.message;
      const errorCode = backendData?.errorCode;

      // ==========================================
      // 🛡️ โซนเช็คสิทธิ์การข้าม Global Error Modal
      // ==========================================

      // 🛑 กฎเหล็ก: ปล่อย VALIDATION_ERROR ทะลุไปให้ React Hook Form จัดการ
      if (errorCode === "VALIDATION_ERROR") {
        return Promise.reject(error);
      }

      // 🛡️ เช็คว่า API เส้นนี้ขอสละสิทธิ์การใช้ Modal สำหรับ errorCode จาก backend หรือไม่?
      const skippedCodes = error.config?.skipErrorCodes || [];
      if (errorCode && skippedCodes.includes(errorCode)) {
        // ถ้าตรงกัน ปล่อยทะลุไปให้ React Query (หน้า Client) จัดการ Redirect เองเงียบๆ
        return Promise.reject(error);
      }

      // ==========================================
      // 🛡️ สิ้นสุดโซนเช็คสิทธิ์การข้าม
      // ==========================================

      const title = `เกิดข้อผิดพลาด`;
      const displayMessage =
        USER_ERROR_MESSAGES[errorCode] || // 1. หาคำแปลสวยๆ จากหน้าบ้านก่อน
        backendMessage || // 2. ถ้าไม่มี เอาข้อความจาก NestJS
        "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุจากเซิร์ฟเวอร์"; // 3. กันเหนียว

      showError(title, displayMessage, status, errorCode);
    } else if (error.request) {
      // 🎯 กรณีที่ 2: ยิงออกไปแล้ว แต่ Backend ไม่ตอบ (เน็ตหลุด, เซิร์ฟเวอร์ล่ม, หรือ Retry แล้วก็ยัง Timeout)
      let title = "ปัญหาการเชื่อมต่อ";
      let message =
        "ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ตหรือลองใหม่ภายหลัง";
      let errorCode = "NETWORK_ERROR";

      if (error.code === "ECONNABORTED") {
        title = "หมดเวลาการเชื่อมต่อ";
        message =
          error.message || "เซิร์ฟเวอร์ตอบสนองช้าเกินไป กรุณาลองใหม่อีกครั้ง";
        errorCode = "TIMEOUT_ERROR";
      }

      showError(title, message, status, errorCode);
    } else {
      // 🎯 กรณีที่ 1: เข้า Axios มาแล้ว แต่พังก่อนยิงออกไป (เช่น ตั้งค่า Header ผิด)
      showError(
        "ข้อผิดพลาดของระบบ",
        error.message || "เกิดปัญหาในการตั้งค่าการเชื่อมต่อ",
        status,
        "AXIOS_SETUP_ERROR",
      );
    }

    // โยน Error กลับไปให้โค้ดแต่ละหน้าทำงานต่อ (เช่น ปิด loading)
    return Promise.reject(error);
  },
);

export default apiClient;
