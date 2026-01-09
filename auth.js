/**
 * SepsisGuard - Mock Authentication System
 * Uses localStorage to simulate a database for users.
 */

const AUTH_KEY = 'sepsis_users_db';
const SESSION_KEY = 'sepsis_current_user';

const Auth = {
    // --- Database Operations ---

    getUsers() {
        const usersJSON = localStorage.getItem(AUTH_KEY);
        return usersJSON ? JSON.parse(usersJSON) : [];
    },

    saveUser(user) {
        const users = this.getUsers();
        users.push(user);
        localStorage.setItem(AUTH_KEY, JSON.stringify(users));
    },

    findUser(patientId) {
        const users = this.getUsers();
        return users.find(u => u.patientId === patientId);
    },

    // --- Auth Actions ---

    register(name, age, dob, contact, email) {
        // Generate random Patient ID (e.g., P-1023)
        const patientId = 'P-' + Math.floor(1000 + Math.random() * 9000);
        // Generate random simple Password (e.g., 1234) - keeping it simple for hackathon
        const password = Math.floor(1000 + Math.random() * 9000).toString();

        const newUser = {
            patientId,
            password, // In a real app, hash this!
            name,
            age,
            dob,
            contact,
            email,
            createdAt: new Date().toISOString()
        };

        this.saveUser(newUser);
        return newUser;
    },

    login(patientId, password) {
        const user = this.findUser(patientId);
        if (user && user.password === password) {
            // Set Session
            localStorage.setItem(SESSION_KEY, JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, message: 'Invalid Patient ID or Password' };
    },

    logout() {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = 'login.html';
    },

    getCurrentUser() {
        const userJSON = localStorage.getItem(SESSION_KEY);
        return userJSON ? JSON.parse(userJSON) : null;
    },

    checkAuth() {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
        }
        return user;
    }
};

// Expose Auth globally for inline scripts if needed, though module pattern is cleaner usually
window.Auth = Auth;
