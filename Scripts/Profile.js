const PROFILE_URL = 'profile.php';

function sanitizeString(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').trim();
}

async function fetchUserProfile() {
    try {
        const response = await fetch(PROFILE_URL + '?action=get_profile', {
            credentials: 'include'
        });

        const data = await response.json();

        if (!data.success) {
            return { success: false, error: data.message };
        }

        return { success: true, user: data.data };

    } catch (error) {
        return { success: false, error: 'Network error occurred' };
    }
}
async function updateProfile(firstName, lastName) {
    try {
        const params = new URLSearchParams();
        params.append('first_name', sanitizeString(firstName));
        params.append('last_name', sanitizeString(lastName));

        const response = await fetch(PROFILE_URL + '?action=update_profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            credentials: 'include',
            body: params.toString()
        });

        const data = await response.json();

        if (!data.success) {
            return { success: false, error: data.message };
        }

        return { success: true, message: data.message };

    } catch (error) {
        return { success: false, error: 'Failed to update profile' };
    }
}
async function changePassword(currentPassword, newPassword, confirmPassword) {
    try {
        if (newPassword !== confirmPassword) {
            return { success: false, error: 'Passwords do not match' };
        }

        const params = new URLSearchParams();
        params.append('old_password', currentPassword);
        params.append('new_password', newPassword);

        const response = await fetch(PROFILE_URL + '?action=change_password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            credentials: 'include',
            body: params.toString()
        });

        const data = await response.json();

        if (!data.success) {
            return { success: false, error: data.message };
        }

        return { success: true, message: data.message };

    } catch (error) {
        return { success: false, error: 'Failed to change password' };
    }
}
async function uploadPhoto(file) {
    try {
        if (!file) {
            return { success: false, error: 'No file selected' };
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return { success: false, error: 'Only JPEG, PNG, and GIF are allowed' };
        }

        if (file.size > 5 * 1024 * 1024) {
            return { success: false, error: 'File size must be less than 5MB' };
        }

        const formData = new FormData();
        formData.append('photo', file);

        const response = await fetch(PROFILE_URL + '?action=upload_photo', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        const data = await response.json();

        if (!data.success) {
            return { success: false, error: data.message };
        }

        return { success: true, photo: data.data.photo };

    } catch (error) {
        return { success: false, error: 'Failed to upload photo' };
    }
}

function renderProfilePage(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
container.innerHTML = `
    <div class="flex justify-center items-center min-h-screen px-4 py-12">
        <div class="max-w-2xl w-full rounded-2xl overflow-hidden border border-white/10 profile-card">
            <div class="relative h-28 bg-[#1a0a12]">
                <div class="absolute inset-0 auth-banner-glow"></div>
                <div class="absolute -bottom-12 left-1/2 -translate-x-1/2">
                    <img id="profile-photo" src="Images/acotrPlaceholder.jpg" alt="Profile Photo"
                         class="w-24 h-24 rounded-full object-cover border-[3px] border-[#C1246B] profile-avatar">
                </div>
            </div>

            <div class="text-center mt-14 mb-6 px-6">
                <h2 id="profile-name" class="text-2xl font-bold text-white mb-1"></h2>
                <p id="profile-email" class="text-sm text-white/40"></p>
            </div>

            <div class="px-8 pb-10 space-y-8">

                <div class="rounded-xl p-6 border border-white/[0.07] profile-section">
                    <h3 class="text-lg font-bold mb-5 flex items-center gap-2 text-[#C1246B]">
                        <i class="fa-solid fa-pen-to-square text-sm"></i> Edit Profile
                    </h3>
                    <form id="edit-profile-form" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold mb-2 tracking-wider text-white/40">First Name</label>
                                <input type="text" id="first-name" name="first_name" required
                                       class="w-full px-4 py-2.5 rounded-lg text-sm transition-all duration-200 profile-input">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold mb-2 tracking-wider text-white/40">Last Name</label>
                                <input type="text" id="last-name" name="last_name" required
                                       class="w-full px-4 py-2.5 rounded-lg text-sm transition-all duration-200 profile-input">
                            </div>
                        </div>
                        <div id="edit-error" class="text-red-400 text-sm font-semibold hidden"></div>
                        <button type="submit"
                                class="w-full py-2.5 rounded-lg text-white text-sm font-semibold transition-all duration-200 border-2 border-transparent bg-[#C1246B] hover:bg-transparent hover:border-[#C1246B]">
                            Update Profile
                        </button>
                    </form>
                </div>

                <div class="rounded-xl p-6 border border-white/[0.07] profile-section">
                    <h3 class="text-lg font-bold mb-5 flex items-center gap-2 text-[#C1246B]">
                        <i class="fa-solid fa-camera text-sm"></i> Change Profile Photo
                    </h3>
                    <form id="upload-photo-form" class="space-y-4">
                        <input type="file" id="photo-input" name="photo" accept="image/*"
                               class="w-full px-4 py-2.5 rounded-lg text-sm cursor-pointer text-white/50 profile-input">
                        <div id="upload-error" class="text-red-400 text-sm font-semibold hidden"></div>
                        <button type="submit"
                                class="w-full py-2.5 rounded-lg text-white text-sm font-semibold transition-all duration-200 border-2 border-transparent bg-[#C1246B] hover:bg-transparent hover:border-[#C1246B]">
                            Upload Photo
                        </button>
                    </form>
                </div>

                <div class="rounded-xl p-6 border border-white/[0.07] profile-section">
                    <h3 class="text-lg font-bold mb-5 flex items-center gap-2 text-[#C1246B]">
                        <i class="fa-solid fa-lock text-sm"></i> Change Password
                    </h3>
                    <form id="change-password-form" class="space-y-4">
                        <div>
                            <label class="block text-xs font-semibold mb-2 tracking-wider text-white/40">Current Password</label>
                            <input type="password" id="current-password" name="current_password" required
                                   class="w-full px-4 py-2.5 rounded-lg text-sm profile-input">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold mb-2 tracking-wider text-white/40">New Password</label>
                            <input type="password" id="new-password" name="new_password" required minlength="6"
                                   class="w-full px-4 py-2.5 rounded-lg text-sm profile-input">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold mb-2 tracking-wider text-white/40">Confirm Password</label>
                            <input type="password" id="confirm-password" name="confirm_password" required minlength="6"
                                   class="w-full px-4 py-2.5 rounded-lg text-sm profile-input">
                        </div>
                        <div id="password-error" class="text-red-400 text-sm font-semibold hidden"></div>
                        <button type="submit"
                                class="w-full py-2.5 rounded-lg text-white text-sm font-semibold transition-all duration-200 border-2 border-transparent bg-[#C1246B] hover:bg-transparent hover:border-[#C1246B]">
                            Change Password
                        </button>
                    </form>
                </div>

            </div>
        </div>
    </div>
`;
    // Load profile data
    loadProfileData();
    
    // Cache DOM elements
    const editForm = document.getElementById('edit-profile-form');
    const uploadForm = document.getElementById('upload-photo-form');
    const passwordForm = document.getElementById('change-password-form');
    const editError = document.getElementById('edit-error');
    const uploadError = document.getElementById('upload-error');
    const passwordError = document.getElementById('password-error');
    
    // Edit profile form
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const firstName = document.getElementById('first-name').value;
        const lastName = document.getElementById('last-name').value;
        
        const result = await updateProfile(firstName, lastName);
        
        if (result.success) {
            editError.classList.add('hidden');
            await loadProfileData();
            alert('Profile updated successfully');
        } else {
            editError.textContent = result.error;
            editError.classList.remove('hidden');
        }
    });
    
    // Upload photo form
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const photoInput = document.getElementById('photo-input');
        const file = photoInput.files[0];
        
        const result = await uploadPhoto(file);
        
        if (result.success) {
            uploadError.classList.add('hidden');
            document.getElementById('profile-photo').src = result.photo;
            photoInput.value = '';
        } else {
            uploadError.textContent = result.error;
            uploadError.classList.remove('hidden');
        }
    });
    
    // Change password form
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        const result = await changePassword(currentPassword, newPassword, confirmPassword);
        
        if (result.success) {
            passwordError.classList.add('hidden');
            passwordForm.reset();
            alert('Password changed successfully');
        } else {
            passwordError.textContent = result.error;
            passwordError.classList.remove('hidden');
        }
    });
}

async function loadProfileData() {
    const result = await fetchUserProfile();
    
    if (result.success && result.user) {
        const user = result.user;
        document.getElementById('profile-name').textContent = `${user.first_name} ${user.last_name}`;
        document.getElementById('profile-email').textContent = user.email;
        document.getElementById('first-name').value = user.first_name;
        document.getElementById('last-name').value = user.last_name;
        
        if (user.photo) {
            document.getElementById('profile-photo').src = user.photo;
        }
    }
}

// document.addEventListener('DOMContentLoaded', async () => {
//     // Check if user is authenticated
//     const authStatus = await Auth.checkAuthStatus();
    
//     if (!authStatus.authenticated) {
//         // Redirect to login
//         window.location.href = 'index.php';
//         return;
//     }
    
//     // Load profile page if container exists
//     if (document.getElementById('profile-container')) {
//         renderProfilePage('profile-container');
//     }
// });

window.Profile = {
    fetchUserProfile,
    updateProfile,
    changePassword,
    uploadPhoto,
    renderProfilePage,
    loadProfileData
};