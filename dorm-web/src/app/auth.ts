export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "student" | "admin";
  studentId: string;
  gender?: string;
  dateOfBirth?: string;
  faculty?: string;
  className?: string;
  address?: string;
}

const STORAGE_KEY = "ktx_user";
const TOKEN_KEY = "sdms_token";

function mapBackendUser(data: any): User {
  return {
    id: data.id,
    name: data.fullName,
    email: data.email,
    phone: data.phoneNumber || "",
    role: data.role,
    studentId: data.studentCode || "",
    gender: data.gender || "",
    dateOfBirth: data.dateOfBirth || "",
    faculty: data.faculty || "",
    className: data.className || "",
    address: data.address || "",
  };
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export async function login(email: string, password: string): Promise<User | null> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    if (errorData.error === "invalid_credentials") {
      throw new Error("Email hoặc mật khẩu không chính xác.");
    }
    throw new Error(errorData.error || "Đăng nhập thất bại.");
  }

  const authData = await res.json();
  const token = authData.token || authData.Token;
  if (!token) throw new Error("Không nhận được token từ hệ thống.");

  localStorage.setItem(TOKEN_KEY, token);

  // Fetch full profile info
  const profileRes = await fetch("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!profileRes.ok) {
    throw new Error("Không thể tải thông tin hồ sơ.");
  }

  const profileData = await profileRes.json();
  const user = mapBackendUser(profileData);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

export async function register(name: string, email: string, password: string): Promise<User | null> {
  const res = await fetch("/api/auth/register-student", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, fullName: name }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    if (errorData.error === "email_exists") {
      throw new Error("Email này đã được đăng ký.");
    }
    throw new Error(errorData.error || "Đăng ký thất bại.");
  }

  const authData = await res.json();
  const token = authData.token || authData.Token;
  if (!token) throw new Error("Đăng ký thành công nhưng không nhận được token.");

  localStorage.setItem(TOKEN_KEY, token);

  // Fetch full profile info
  const profileRes = await fetch("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!profileRes.ok) {
    throw new Error("Không thể tải thông tin hồ sơ sau đăng ký.");
  }

  const profileData = await profileRes.json();
  const user = mapBackendUser(profileData);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

// export function getCurrentUser(): User | null {
//   try {
//     const raw = localStorage.getItem(STORAGE_KEY);
//     return raw ? JSON.parse(raw) : null;
//   } catch {
//     return null;
//   }
// }

export function getCurrentUser() {
  return {
    id: "test-id",
    name: "Han Pham - Test",
    role: "student"
  };
}

export async function updateCurrentUser(updates: Partial<User>): Promise<User> {
  const token = getToken();
  if (!token) throw new Error("Chưa đăng nhập.");

  const payload = {
    fullName: updates.name,
    phoneNumber: updates.phone,
    studentCode: updates.studentId,
    gender: updates.gender,
    dateOfBirth: updates.dateOfBirth ? updates.dateOfBirth : undefined,
    faculty: updates.faculty,
    className: updates.className,
    address: updates.address,
  };

  const res = await fetch("/api/auth/me", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Cập nhật hồ sơ thất bại.");
  }

  const profileData = await res.json();
  const user = mapBackendUser(profileData);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TOKEN_KEY);
}
