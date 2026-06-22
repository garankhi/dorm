import { getToken } from "../../auth";
import { ApplicationStatus } from "./adminApplicationsData";

export type AdminApplication = {
    id: string;
    studentId: string;
    studentName: string;
    studentCode?: string;
    email: string;
    phoneNumber?: string;
    roomId: string;
    room: string;
    building: string;
    reason?: string;
    status: ApplicationStatus;
    submittedAt: string;
    reviewedAt?: string;
    reviewedByUserId?: string;
    adminNote?: string;
};

export type AdminApplicationListResponse = {
    total: number;
    page: number;
    pageSize: number;
    items: AdminApplication[];
};

export type AdminApplicationQuery = {
    page: number;
    pageSize: number;
    status?: ApplicationStatus | "all";
    building?: string;
    q?: string;
};

function authHeader() {
    const token = getToken();
    if (!token) throw new Error("Chưa đăng nhập");

    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export async function fetchAdminApplication(query: AdminApplicationQuery) {
    const params = new URLSearchParams({
        page: String(query.page),
        pageSize: String(query.pageSize),
    });

    if (query.status && query.status !== "all") params.set("status", query.status);
    if (query.building && query.building !== "all") params.set("building", query.building);
    if (query.q?.trim()) params.set("q", query.q.trim());

    const res = await fetch(`/api/applications/admin?${params}`, {
        headers: authHeader(),
    });

    if (!res.ok) throw new Error("Không thể tải danh sách đơn");
    return res.json() as Promise<AdminApplicationListResponse>;
}

export async function rejectApplication(id: string, adminNote: string) {
    const res = await fetch(`/api/applications/${id}/reject`, {
        method: "PATCH",
        headers: authHeader(),
        body: JSON.stringify({adminNote}),
    });

    if(!res.ok) throw new Error("Từ chối đơn thất bại");
}

export async function approveApplication(id: string, adminNote: string) {
    const res = await fetch(`/api/applications/${id}/approve`, {
        method: "PATCH",
        headers: authHeader(),
        body: JSON.stringify({adminNote}),
    })

    if (!res.ok) throw new Error("Chấp nhận đơn thất bại");
}