"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import {
  issueStaffInvitationApi,
  previewStaffInvitationApi,
  submitStaffInvitationApi,
  decideStaffInvitationApi,
  unlinkStaffInvitationApi,
} from "../api";
import { workScheduleStaffInvitationKeys } from "../work-schedule-staff-invitation-keys";
import { workScheduleStaffKeys } from "../../staff/work-schedule-staff-keys";
import { workScheduleLogInKeys } from "../../log-in/work-schedule-log-in-keys";
import { API_ERROR_MESSAGES } from "@/constants/error-messages";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

export function useStaffInvitationActions(placeId?: string) {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (isAxiosError(error)) {
      const code = error.response?.data?.errorCode as ErrorCode;
      if (code && API_ERROR_MESSAGES[code]) {
        return API_ERROR_MESSAGES[code];
      }
      return error.response?.data?.message || fallback;
    }
    if (error instanceof Error) return error.message;
    return fallback;
  };

  const invalidateCommon = () => {
    if (userId) {
      void queryClient.invalidateQueries({
        queryKey: workScheduleLogInKeys.lists(userId),
      });
      void queryClient.invalidateQueries({
        queryKey: workScheduleStaffInvitationKeys.mine(userId),
      });
      if (placeId) {
        void queryClient.invalidateQueries({
          queryKey: workScheduleStaffInvitationKeys.byPlace(userId, placeId),
        });
        void queryClient.invalidateQueries({
          queryKey: workScheduleStaffKeys.listsByPlaceId(userId, placeId),
        });
      }
    }
  };

  const issueMutation = useMutation({
    mutationFn: async (staffId: string) => {
      if (!placeId) throw new Error("Place ID is required");
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");
      return issueStaffInvitationApi(placeId, staffId, token);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "ไม่สามารถสร้างรหัสคำเชิญได้"));
    },
    onSuccess: () => {
      invalidateCommon();
    },
  });

  const previewMutation = useMutation({
    mutationFn: async (code: string) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");
      return previewStaffInvitationApi(code, token);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "ไม่พบรหัสคำเชิญหรือรหัสไม่ถูกต้อง"));
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (code: string) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");
      return submitStaffInvitationApi(code, token);
    },
    onSuccess: () => {
      toast.success("ส่งคำขอผูกบัญชีเรียบร้อยแล้ว รอผู้ดูแลอนุมัติ");
      invalidateCommon();
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "ไม่สามารถส่งคำขอผูกบัญชีได้"));
    },
  });

  const decideMutation = useMutation({
    mutationFn: async ({
      invitationId,
      decision,
    }: {
      invitationId: string;
      decision: "APPROVE" | "REJECT";
    }) => {
      if (!placeId) throw new Error("Place ID is required");
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");
      return decideStaffInvitationApi(placeId, invitationId, decision, token);
    },
    onSuccess: (_, vars) => {
      toast.success(
        vars.decision === "APPROVE"
          ? "อนุมัติการผูกบัญชีพนักงานสำเร็จ"
          : "ปฏิเสธคำขอเรียบร้อยแล้ว",
      );
      invalidateCommon();
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "ไม่สามารถดำเนินการตัดสินใจได้"));
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async (staffId: string) => {
      if (!placeId) throw new Error("Place ID is required");
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");
      return unlinkStaffInvitationApi(placeId, staffId, token);
    },
    onSuccess: () => {
      toast.success("ยกเลิกการผูกบัญชีสำเร็จ");
      invalidateCommon();
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "ไม่สามารถยกเลิกการผูกบัญชีได้"));
    },
  });

  return {
    issueMutation,
    previewMutation,
    submitMutation,
    decideMutation,
    unlinkMutation,
  };
}
