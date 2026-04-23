const AUTH_URL = 'Auth.php';

function sanitizeString(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').trim();
}

function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && !/<>'"/.test(email);
}
async function register(firstName, lastName, username, email, password) {
    try {
        const params = new URLSearchParams();
        params.append('first_name', sanitizeString(firstName));
        params.append('last_name', sanitizeString(lastName));
        params.append('username', sanitizeString(username));
        params.append('email', sanitizeString(email).toLowerCase());
        params.append('password', password);

        const response = await fetch(AUTH_URL + '?action=register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });

        const data = await response.json();

        if (!data.success) {
            return { success: false, error: data.message };
        }

        return {
            success: true,
            user: {
                id: data.data.user_id,
                username: data.data.username
            }
        };

    } catch (error) {
        return { success: false, error: 'Network error' };
    }
}

async function login(email, password) {
    try {
        const params = new URLSearchParams();
        params.append('email', sanitizeString(email).toLowerCase());
        params.append('password', password);

        const response = await fetch(AUTH_URL + '?action=login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });

        const data = await response.json();

        if (!data.success) {
            return { success: false, error: data.message };
        }

        return {
            success: true,
            user: data.data
        };

    } catch (error) {
        return { success: false, error: 'Network error occurred' };
    }
}

async function checkAuthStatus() {
    try {
        const response = await fetch(AUTH_URL + '?action=check');
        const data = await response.json();

        if (!data.success) {
            return { authenticated: false };
        }

        const result = data.data;

        if (!result.authenticated) {
            return { authenticated: false };
        }

        return {
            authenticated: true,
            user: result.user
        };

    } catch (error) {
        return { authenticated: false };
    }
}

// async function handleLogout() {
//     if (confirm('Are you sure you want to logout?')) {
//         await logout();
//         // Show login form directly without re-checking status
//         showLoginForm();
//     }
// }

// async function updateUIForAuth() {
//     const authStatus = await checkAuthStatus();
//     const authContainer = document.getElementById('auth-container');
    
//     if (!authContainer) return;
    
//     if (authStatus.authenticated) {
//         // Show logout button
//         authContainer.innerHTML = `
//             <div class="text-center">
//                 <button id="logout-btn" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Logout</button>
//             </div>
//         `;
        
//         // Add logout event
//         const logoutBtn = document.getElementById('logout-btn');
//         if (logoutBtn) {
//             logoutBtn.addEventListener('click', handleLogout);
//         }
//     } else {
//         // Show login form
//         showLoginForm();
//     }
// }

function renderRegisterForm(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
       <div class = "flex justify-center items-center min-h-screen">
        <div class="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mt-12 w-full">
            <h2 class="text-2xl font-bold mb-6 text-center">Create Account</h2>
            <form id="register-form" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-gray-700 mb-2">First Name</label>
                        <input type="text" name="first_name" required class="w-full px-3 py-2 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-gray-700 mb-2">Last Name</label>
                        <input type="text" name="last_name" required class="w-full px-3 py-2 border rounded-lg">
                    </div>
                </div>
                <div>
                    <label class="block text-gray-700 mb-2">Username</label>
                    <input type="text" name="username" required class="w-full px-3 py-2 border rounded-lg">
                </div>
                <div>
                    <label class="block text-gray-700 mb-2">Email</label>
                    <input type="email" name="email" required class="w-full px-3 py-2 border rounded-lg">
                </div>
                <div>
                    <label class="block text-gray-700 mb-2">Password</label>
                    <input type="password" name="password" required minlength="6" class="w-full px-3 py-2 border rounded-lg">
                </div>
                <div id="register-error" class="text-red-500 text-sm hidden"></div>
                <button type="submit" class="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600">Register</button>
            </form>
            <p class="mt-4 text-center text-gray-600">Already have an account? <a href="javascript:void(0)" onclick="showLoginForm()" class="text-green-500 hover:underline">Login</a></p>
        </div></div>
    `;
    
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const firstName = formData.get('first_name');
        const lastName = formData.get('last_name');
        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');
        
        const errorDiv = document.getElementById('register-error');

        
        errorDiv.classList.add('hidden');
        
        const result = await register(firstName, lastName, username,email, password);
        
        if (result.success) {
            await window.updateUIForAuth();
        } else {
            errorDiv.textContent = result.error || 'Registration failed';
            errorDiv.classList.remove('hidden');
        }
    });
}

function renderLoginForm(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
        <div class = "flex justify-center items-center min-h-screen">
        <div class="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mt-12 w-full">
            <h2 class="text-2xl font-bold mb-6 text-center">Login</h2>
            <form id="login-form" class="space-y-4">
                <div>
                    <label class="block text-gray-700 mb-2">Email</label>
                    <input type="email" name="email" required class="w-full px-3 py-2 border rounded-lg">
                </div>
                <div>
                    <label class="block text-gray-700 mb-2">Password</label>
                    <input type="password" name="password" required class="w-full px-3 py-2 border rounded-lg">
                </div>
                <div id="login-error" class="text-red-500 text-sm hidden"></div>
                <button type="submit" class="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">Login</button>
            </form>
            <p class="mt-4 text-center text-gray-600">Don't have an account? <a href="javascript:void(0)" onclick="showRegisterForm()" class="text-blue-500 hover:underline">Register</a></p>
        </div></div>
    `;
    
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        
        const errorDiv = document.getElementById('login-error');
        errorDiv.classList.add('hidden');
        
        const result = await login(email, password);
        
        if (result.success) {
            await window.updateUIForAuth();
        } else {
            errorDiv.textContent = result.error || 'Login failed';
            errorDiv.classList.remove('hidden');
        }
    });
}

function showLoginForm() {
    renderLoginForm('auth-container');
}

function showRegisterForm() {
    renderRegisterForm('auth-container');
}

// document.addEventListener('DOMContentLoaded', async () => {
//     if (document.getElementById('auth-container')) {
//         await updateUIForAuth();
//     }
// });

window.Auth = {
    register,
    login,
    checkAuthStatus,
    // updateUIForAuth,
    // handleLogout,
    renderLoginForm,
    renderRegisterForm,
    showLoginForm,
    showRegisterForm
};
