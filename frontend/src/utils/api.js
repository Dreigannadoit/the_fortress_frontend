import axios from 'axios';

// Use environment variable or default for flexibility
const API_BASE_URL = 'http://localhost:8080/api';

// Create an Axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- Interceptor to add JWT token to requests ---
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('jwtToken'); // Get token from storage
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- Interceptor to handle 401 Unauthorized errors (e.g., expired token) ---
apiClient.interceptors.response.use(
    (response) => response, // Pass through successful responses
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token might be invalid or expired
            console.error("Unauthorized access - 401 Interceptor");
            localStorage.removeItem('jwtToken'); // Clear bad token
            // Redirect to login or trigger a logout action
            // Avoid infinite loops if the login page itself triggers this
            if (window.location.pathname !== '/auth') {
                 window.location.href = '/auth'; // Force reload to reset state
            }
        }
        return Promise.reject(error); // Propagate the error
    }
);


// === Authentication ===
export const login = (username, password) => {
    return apiClient.post('/auth/login', { username, password });
};

export const register = (username, password) => {
    return apiClient.post('/auth/register', { username, password });
};


// === Player Data ===
export const getPlayerData = () => {
    return apiClient.get('/player/data');
};

/**
 * Updates the core player stats after a game session or significant event.
 * @param {object} statsData - Object matching UpdatePlayerStatsRequest DTO
 * e.g., { currency, level, kills, currentWeaponName, activeSkillIds }
 */
export const updatePlayerStatsApi = (statsData) => {
    return apiClient.put('/player/data', statsData);
};

/**
 * Purchases an item from the store.
 * @param {string} itemId - The unique ID of the weapon or game item.
 * @param {string} category - The category ("weapons", "turrets", etc.).
 */
export const purchaseItemApi = (itemId, category) => {
    return apiClient.post('/player/purchase', { itemId, category });
};

/**
 * Sets the player's currently equipped weapon.
 * @param {string} weaponName - The name/ID of the weapon to equip.
 */
export const setCurrentWeaponApi = (weaponName) => {
    return apiClient.put(`/player/weapon/${weaponName}`);
};

/**
 * Sets the player's active skills/items.
 * @param {string[]} activeSkillIds - Array of item IDs to set as active.
 */
export const setActiveSkillsApi = (activeSkillIds) => {
    return apiClient.put('/player/skills/active', { activeSkillIds });
};

export const deleteAccountApi = () => {
    return apiClient.delete('/player/account');
};

// === Store Data ===
export const getStoreItems = () => {
    return apiClient.get('/store/items');
};

export default apiClient;