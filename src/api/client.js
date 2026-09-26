// AUTHOR : ANKITH KUMAR
// Minimal fetch-based API client. No extra dependencies (no axios) so the
// prototype runs with a plain `npm install`.

// Change this if the backend runs on a different host/port.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function getToken() {
    return localStorage.getItem("osm_token");
}

export function getSession() {
    const token = localStorage.getItem("osm_token");
    const username = localStorage.getItem("osm_username");
    const roles = JSON.parse(localStorage.getItem("osm_roles") || "[]");
    if (!token) return null;
    return { token, username, roles };
}

export function saveSession({ accessToken, username, roles, forcePasswordChange = false }) {
    localStorage.setItem("osm_token", accessToken);
    localStorage.setItem("osm_username", username);
    localStorage.setItem("osm_roles", JSON.stringify(roles || []));
    localStorage.setItem("osm_force_password_change", String(forcePasswordChange));
}

export function clearSession() {
    localStorage.removeItem("osm_token");
    localStorage.removeItem("osm_username");
    localStorage.removeItem("osm_roles");
    localStorage.removeItem("osm_force_password_change");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (auth) {
        const token = getToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    } catch (networkError) {
        throw new Error(
            `Could not reach the backend at ${API_BASE_URL}. Is it running? (${networkError.message})`
        );
    }

    if (response.status === 401) {
        clearSession();
        throw new Error("Session expired. Please log in again.");
    }

    if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try {
            const errorBody = await response.json();
            message = errorBody.message || message;
        } catch {
            // response had no JSON body - keep default message
        }
        throw new Error(message);
    }

    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

export const api = {
    get: (path) => request(path, { method: "GET" }),
    post: (path, body) => request(path, { method: "POST", body }),
    put: (path, body) => request(path, { method: "PUT", body }),
    del: (path) => request(path, { method: "DELETE" }),
};

// For endpoints that return a raw file (e.g. a PDF) instead of JSON.
export async function getBlob(path) {
    const headers = {};
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, { method: "GET", headers });
    } catch (networkError) {
        throw new Error(`Could not reach the backend at ${API_BASE_URL}. Is it running? (${networkError.message})`);
    }
    if (response.status === 401) {
        clearSession();
        throw new Error("Session expired. Please log in again.");
    }
    if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
    }
    return response.blob();
}

// For endpoints that accept a multipart file upload. Don't set Content-Type manually -
// the browser needs to add its own multipart boundary.
export async function uploadFile(path, file, method = "POST") {
    const headers = {};
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const formData = new FormData();
    formData.append("file", file, file.name || "answer-sheet.pdf");

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, { method, headers, body: formData });
    } catch (networkError) {
        throw new Error(`Could not reach the backend at ${API_BASE_URL}. Is it running? (${networkError.message})`);
    }
    if (response.status === 401) {
        clearSession();
        throw new Error("Session expired. Please log in again.");
    }
    if (!response.ok) {
        let message = `Upload failed (${response.status})`;
        try {
            const errorBody = await response.json();
            message = errorBody.message || message;
        } catch {
            // no JSON body
        }
        throw new Error(message);
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}
