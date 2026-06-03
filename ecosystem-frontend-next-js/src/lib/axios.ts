import axios from "axios";
import { useErrorStore } from "@/store/useErrorStore";

// 🌟 สอนให้ TypeScript รู้จัก Config พิเศษของเรา
declare module "axios" {
  export interface AxiosRequestConfig {
    skipGlobalErrorModal?: number[];
    retryCount?: number; // เอาไว้นับจำนวนครั้งที่ Retry
  }
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001",
  timeout: 5000, // 🌟 ตั้งเวลา Timeout ไว้ที่ 5 วินาที
});

apiClient.interceptors.response.use(
  (response) => response, // ถ้าสำเร็จ ปล่อยผ่านไป
  async (error) => {
    // เติม async เพราะเราจะใช้ await ในการหน่วงเวลา Retry

    const status = error.response?.status;
    const config = error.config;

    // 🛡️ ป้องกันกรณี Edge Case ที่ config หายไป (บางครั้ง Axios สร้าง Request ไม่สำเร็จตั้งแต่ต้น)
    if (!config) {
      return Promise.reject(error);
    }

    // 🌟 1. ดึง Method มาเช็ค และล็อกเป้าให้ทำ Auto-retry เฉพาะ GET เท่านั้น
    const isGetMethod = config.method?.toLowerCase() === "get";

    // 🌟 2. เพิ่มเงื่อนไข isGetMethod เข้าไปใน if
    // 🌟 ระบบ Auto-Retry (กรณี Timeout หรือเน็ตหลุด)
    // ถ้า Error เป็น Timeout และยัง Retry ไม่เกิน 2 ครั้ง
    if (
      isGetMethod &&
      (error.code === "ECONNABORTED" || error.message === "Network Error") &&
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

    // 🌟 เช็คว่า API เส้นนี้ขอ "สละสิทธิ์ (Skip)" การใช้ Global Modal สำหรับ Status นี้หรือไม่?
    const skippedStatuses = config?.skipGlobalErrorModal || [];
    if (skippedStatuses.includes(status)) {
      // ปล่อย Error ทะลุไปให้ catch ของหน้านั้นๆ จัดการเองเงียบๆ (เช่น 409 Conflict)
      return Promise.reject(error);
    }

    // 🚨 ถ้าไม่ได้ขอสละสิทธิ์ (Skip) ก็ให้ Global Modal ทำงานตามปกติ
    if (
      status === undefined || // กรณี Network Error ไม่มี status
      [400, 401, 403, 404, 500, 502, 503].includes(status) || // (เพิ่ม 400 เผื่อไว้กรณี Validation พัง)
      error.message === "Network Error"
    ) {
      // 🌟 ดึงข้อมูล JSON มาตรฐานที่เราทำ Filter ไว้ใน NestJS
      const backendData = error.response?.data;

      const title = status ? `เกิดข้อผิดพลาด (${status})` : "ปัญหาการเชื่อมต่อ";

      // 🌟 จัดลำดับความสำคัญของข้อความ Error อย่างชัดเจน
      const message =
        // 1. ข้อความภาษาไทยสวยๆ จาก NestJS (ถ้ามี)
        backendData?.message ||
        // 2. ข้อความจาก Axios (เช่น Timeout) = กรณีที่ไม่ได้ response จาก backend
        error.message ||
        // 3. ข้อความสำรองท้ายสุด (กันเหนียวสุดท้าย)
        "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์";

      useErrorStore.getState().showError(title, message, status);
    }

    // โยน Error กลับไปให้โค้ดแต่ละหน้า เผื่อต้องหยุดการโหลด (setIsLoading) หรือทำอย่างอื่นต่อตามแต่ละกรณี
    return Promise.reject(error);
  },
);

export default apiClient;
