import apiClient from "@/lib/axios";
import {
  IssueStaffInvitationParamDtoSchema,
  IssueStaffInvitationResponse,
} from "@backend/modules/work-schedule/staff-invitation/commands/issue-staff-invitation.command";
import {
  PreviewStaffInvitationBodyDtoSchema,
  PreviewStaffInvitationResponse,
} from "@backend/modules/work-schedule/staff-invitation/queries/preview-staff-invitation.query";
import {
  SubmitStaffInvitationBodyDtoSchema,
  SubmitStaffInvitationResponse,
} from "@backend/modules/work-schedule/staff-invitation/commands/submit-staff-invitation.command";
import { ListMineStaffInvitationsResponse } from "@backend/modules/work-schedule/staff-invitation/queries/list-mine-staff-invitation.query";
import {
  ListStaffInvitationsByPlaceParamDtoSchema,
  ListStaffInvitationsByPlaceResponse,
} from "@backend/modules/work-schedule/staff-invitation/queries/list-by-place-staff-invitation.query";
import {
  DecideStaffInvitationBodyDtoSchema,
  DecideStaffInvitationParamDtoSchema,
  DecideStaffInvitationResponse,
} from "@backend/modules/work-schedule/staff-invitation/commands/decide-staff-invitation.command";
import { UnlinkStaffInvitationParamDtoSchema } from "@backend/modules/work-schedule/staff-invitation/commands/unlink-staff-invitation.command";

export const issueStaffInvitationApi = async (
  placeId: string,
  staffId: string,
  token: string,
): Promise<IssueStaffInvitationResponse> => {
  const parsed = IssueStaffInvitationParamDtoSchema.safeParse({
    place_id: placeId,
    staff_id: staffId,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }

  const res = await apiClient.post<IssueStaffInvitationResponse>(
    `/api/work-schedule/staff-invitations/places/${parsed.data.place_id}/staff/${parsed.data.staff_id}/issue`,
    {},
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.data;
};

export const previewStaffInvitationApi = async (
  code: string,
  token: string,
): Promise<PreviewStaffInvitationResponse> => {
  const parsed = PreviewStaffInvitationBodyDtoSchema.safeParse({ code });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "รหัสคำเชิญไม่ถูกต้อง");
  }

  const res = await apiClient.post<PreviewStaffInvitationResponse>(
    `/api/work-schedule/staff-invitations/preview`,
    parsed.data,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.data;
};

export const submitStaffInvitationApi = async (
  code: string,
  token: string,
): Promise<SubmitStaffInvitationResponse> => {
  const parsed = SubmitStaffInvitationBodyDtoSchema.safeParse({ code });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "รหัสคำเชิญไม่ถูกต้อง");
  }

  const res = await apiClient.post<SubmitStaffInvitationResponse>(
    `/api/work-schedule/staff-invitations/submit`,
    parsed.data,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.data;
};

export const listMineStaffInvitationsApi = async (
  token: string,
  skipErrorCodes?: string[],
): Promise<ListMineStaffInvitationsResponse> => {
  const res = await apiClient.get<ListMineStaffInvitationsResponse>(
    `/api/work-schedule/staff-invitations/mine`,
    {
      headers: { Authorization: `Bearer ${token}` },
      skipErrorCodes,
    },
  );
  return res.data;
};

export const listStaffInvitationsByPlaceApi = async (
  placeId: string,
  token: string,
  skipErrorCodes?: string[],
): Promise<ListStaffInvitationsByPlaceResponse> => {
  const parsed = ListStaffInvitationsByPlaceParamDtoSchema.safeParse({
    place_id: placeId,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }

  const res = await apiClient.get<ListStaffInvitationsByPlaceResponse>(
    `/api/work-schedule/staff-invitations/places/${parsed.data.place_id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      skipErrorCodes,
    },
  );
  return res.data;
};

export const decideStaffInvitationApi = async (
  placeId: string,
  invitationId: string,
  decision: "APPROVE" | "REJECT",
  token: string,
): Promise<DecideStaffInvitationResponse> => {
  const parsedParam = DecideStaffInvitationParamDtoSchema.safeParse({
    place_id: placeId,
    invitation_id: invitationId,
  });
  if (!parsedParam.success) {
    throw new Error(parsedParam.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }

  const parsedBody = DecideStaffInvitationBodyDtoSchema.safeParse({ decision });
  if (!parsedBody.success) {
    throw new Error(parsedBody.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }

  const res = await apiClient.post<DecideStaffInvitationResponse>(
    `/api/work-schedule/staff-invitations/places/${parsedParam.data.place_id}/${parsedParam.data.invitation_id}/decision`,
    parsedBody.data,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.data;
};

export const unlinkStaffInvitationApi = async (
  placeId: string,
  staffId: string,
  token: string,
): Promise<void> => {
  const parsed = UnlinkStaffInvitationParamDtoSchema.safeParse({
    place_id: placeId,
    staff_id: staffId,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }

  await apiClient.delete(
    `/api/work-schedule/staff-invitations/places/${parsed.data.place_id}/staff/${parsed.data.staff_id}/link`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
};
