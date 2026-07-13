import { getToken } from "../../auth";
import type { MaintenanceIssueType, MaintenanceSeverity, MaintenanceStatus } from "./adminMaintenancesData";

export type AdminMaintenance = {
  id: string;
  studentId: string;
  studentName: string;
  roomId: string;
  roomNumber: string;
  buildingName: string;
  issueType: MaintenanceIssueType;
  severity: MaintenanceSeverity;
  status: MaintenanceStatus;
  description: string;
  internalNote?: string;
  rejectionReason?: string;
  roomUnderMaintenance: boolean;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type MaintenanceAttachment = {
  id: string;
  fileName: string;
  storagePath: string;
  mimeType?: string | null;
  createdAt: string;
};

export type MaintenanceHistoryItem = {
  id: string;
  actorRole: string;
  message: string;
  createdAt: string;
};

export type AdminMaintenanceDetail = AdminMaintenance & {
  confirmedAt?: string | null;
  resolvedAt?: string | null;
  attachments?: MaintenanceAttachment[];
};

export type RoomMaintenanceThreadItem = {
  id: string;
  studentId: string;
  studentName: string;
  issueType: string;
  severity: string;
  status: string;
  description: string;
  internalNote?: string | null;
  rejectionReason?: string | null;
  roomUnderMaintenance: boolean;
  submittedAt: string;
  resolvedAt?: string | null;
  confirmedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  history: MaintenanceHistoryItem[];
  attachments: MaintenanceAttachment[];
};

export type RoomMaintenanceThreadResponse = {
  roomId: string;
  roomNumber: string;
  buildingName: string;
  roomStatus: string;
  maintenances: RoomMaintenanceThreadItem[];
};

export type AdminMaintenanceQuery = {
  status?: string;
};

function authHeader() {
  const token = getToken();
  if (!token) throw new Error("Chưa đăng nhập");

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchAdminMaintenances(query?: AdminMaintenanceQuery) {
  const params = new URLSearchParams();
  if (query?.status && query.status !== "all") params.set("status", query.status);

  const res = await fetch(`/api/maintenances?${params.toString()}`, {
    headers: authHeader(),
  });

  if (!res.ok) {
    throw new Error("Không thể tải danh sách yêu cầu bảo trì");
  }

  return (await res.json()) as Promise<AdminMaintenance[]>;
}

export async function fetchAdminMaintenance(id: string) {
  const res = await fetch(`/api/maintenances/${id}`, {
    headers: authHeader(),
  });

  if (!res.ok) {
    throw new Error("Không thể tải chi tiết yêu cầu bảo trì");
  }

  return (await res.json()) as Promise<AdminMaintenanceDetail>;
}

export async function fetchAdminMaintenanceHistory(id: string) {
  const res = await fetch(`/api/maintenances/${id}/history`, {
    headers: authHeader(),
  });

  if (!res.ok) {
    throw new Error("Không thể tải lịch sử xử lý");
  }

  return (await res.json()) as Promise<MaintenanceHistoryItem[]>;
}

export async function fetchRoomMaintenanceThread(roomId: string) {
  const res = await fetch(`/api/maintenances/room/${roomId}/thread`, {
    headers: authHeader(),
  });

  if (!res.ok) {
    throw new Error("Không thể tải hộp trao đổi phòng");
  }

  return (await res.json()) as Promise<RoomMaintenanceThreadResponse>;
}

export async function postMaintenanceComment(id: string, message: string) {
  const res = await fetch(`/api/maintenances/${id}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Không thể gửi bình luận");
  }

  return await res.json();
}

export type UpdateMaintenanceRequest = {
  status?: MaintenanceStatus;
  severity?: MaintenanceSeverity;
  internalNote?: string | null;
  rejectionReason?: string | null;
  roomUnderMaintenance?: boolean;
};

export async function updateAdminMaintenance(id: string, payload: UpdateMaintenanceRequest) {
  const res = await fetch(`/api/maintenances/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Cập nhật yêu cầu bảo trì thất bại");
  }

  return await res.json();
}

export async function uploadMaintenanceAttachment(id: string, file: File) {
  const token = getToken();
  if (!token) throw new Error("Chưa đăng nhập");

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`/api/maintenances/${id}/attachments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Tải ảnh thất bại");
  }

  return (await res.json()) as Promise<MaintenanceAttachment>;
}
