import axios from 'axios';

const API_URL = 'http://localhost:8080/api'; // Point to your Spring Boot API URL (default port 8080)


const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true
});

// Enhanced request interceptor
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Enhanced response interceptor
apiClient.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Handle token expiration
            localStorage.removeItem('jwtToken');
            window.location.href = '/auth'; // Force full page reload
        }
        return Promise.reject(error);
    }
);

// --- Auth Service ---
export const login = (username, password) => {
    return apiClient.post('/auth/login', { username, password });
};

export const register = (username, password) => {
    return apiClient.post('/auth/register', { username, password });
};

// --- Player Data Service ---
export const getPlayerData = () => {
    return apiClient.get('/player/data');
};

export const updatePlayerDataApi = (data) => { // Renamed to avoid conflict
    return apiClient.put('/player/data', data);
};

export const purchaseItemApi = (itemId, category) => { // Renamed
    return apiClient.post('/player/purchase', { itemId, category });
};

 export const setCurrentWeaponApi = (weaponName) => {
     return apiClient.put(`/player/weapon/${weaponName}`);
 };

 export const setActiveSkillsApi = (activeSkillIds) => {
     return apiClient.put('/player/skills/active', { activeSkillIds });
 };

// --- Store Service ---
export const getStoreItems = () => {
    return apiClient.get('/store/items');
};

export default apiClient; // Export the configured instance if needed elsewhere