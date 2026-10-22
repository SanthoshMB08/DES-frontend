import { api, saveSession, clearSession } from "./client";

// Maps backend role names to frontend dashboard routes.
export const ROLE_ROUTES = {
    ROLE_ADMIN: "/admin",
    ROLE_HOD: "/hod",
    ROLE_RE: "/re",
    ROLE_BOE: "/boe",
    ROLE_CHIEF: "/chief",
    ROLE_REVIEWER: "/reviewer",
    ROLE_VALUATOR: "/valuator",
    ROLE_SCANNER: "/scanner",
    ROLE_STAFF: "/staff",
};

export function routeForRoles(roles = []) {
    for (const role of roles) {
        if (ROLE_ROUTES[role]) return ROLE_ROUTES[role];
    }
    return "/login";
}

export async function login(username, password) {
    const response = await api.post("/api/auth/login", { username, password }, { auth: false });
    // LoginResponse: { tokenType, accessToken, expiresInSeconds, username, roles, forcePasswordChange }
    saveSession({
        accessToken: response.accessToken,
        username: response.username,
        roles: response.roles,
        forcePasswordChange: response.forcePasswordChange,
    });
    return response;
}

export async function changePassword(currentPassword, newPassword) {
    return api.post("/api/auth/change-password", { currentPassword, newPassword });
}

export function logout() {
    // Best-effort - the JWT is stateless so there's nothing server-side to invalidate,
    // but we still tell the backend in case that ever changes.
    api.post("/api/auth/logout").catch(() => {});
    clearSession();
}
