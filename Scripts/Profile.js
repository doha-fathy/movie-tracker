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
        const response = await fetch(PROFILE_URL + '?action=update_profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                first_name: sanitizeString(firstName),
                last_name: sanitizeString(lastName)
            })
        });

        const data = await response.json();

        if (!data.success) {
            return { success: false, error: data.message };
        }

        return { success: true, user: data.data };

    } catch (error) {
        return { success: false, error: 'Failed to update profile' };
    }
}
async function changePassword(currentPassword, newPassword, confirmPassword) {
    try {
        if (newPassword !== confirmPassword) {
            return { success: false, error: 'Passwords do not match' };
        }

        const response = await fetch(PROFILE_URL + '?action=change_password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
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
        formData.append('action', 'upload_photo');
        formData.append('photo', file);

        const response = await fetch(PROFILE_URL, {
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
        <div class="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
            <h1 class="text-3xl font-bold mb-6">My Profile</h1>
            
            <!-- Profile Info Section -->
            <div class="mb-8">
                <div class="flex items-center mb-6">
                    <img id="profile-photo" src="https://via.placeholder.com/100" alt="Profile Photo" class="w-24 h-24 rounded-full mr-6 object-cover">
                    <div>
                        <h2 id="profile-name" class="text-2xl font-bold"></h2>
                        <p id="profile-email" class="text-gray-600"></p>
                    </div>
                </div>
            </div>
            
            <!-- Edit Profile Form -->
            <div class="mb-8 border-t pt-6">
                <h3 class="text-xl font-bold mb-4">Edit Profile</h3>
                <form id="edit-profile-form" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-gray-700 mb-2">First Name</label>
                            <input type="text" id="first-name" name="first_name" required class="w-full px-3 py-2 border rounded-lg">
                        </div>
                        <div>
                            <label class="block text-gray-700 mb-2">Last Name</label>
                            <input type="text" id="last-name" name="last_name" required class="w-full px-3 py-2 border rounded-lg">
                        </div>
                    </div>
                    <div id="edit-error" class="text-red-500 text-sm hidden"></div>
                    <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">Update Profile</button>
                </form>
            </div>
            
            <!-- Upload Photo Section -->
            <div class="mb-8 border-t pt-6">
                <h3 class="text-xl font-bold mb-4">Change Profile Photo</h3>
                <form id="upload-photo-form" class="space-y-4">
                    <div>
                        <input type="file" id="photo-input" name="photo" accept="image/*" class="w-full">
                    </div>
                    <div id="upload-error" class="text-red-500 text-sm hidden"></div>
                    <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Upload Photo</button>
                </form>
            </div>
            
            <!-- Change Password Section -->
            <div class="mb-8 border-t pt-6">
                <h3 class="text-xl font-bold mb-4">Change Password</h3>
                <form id="change-password-form" class="space-y-4">
                    <div>
                        <label class="block text-gray-700 mb-2">Current Password</label>
                        <input type="password" id="current-password" name="current_password" required class="w-full px-3 py-2 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-gray-700 mb-2">New Password</label>
                        <input type="password" id="new-password" name="new_password" required minlength="6" class="w-full px-3 py-2 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-gray-700 mb-2">Confirm Password</label>
                        <input type="password" id="confirm-password" name="confirm_password" required minlength="6" class="w-full px-3 py-2 border rounded-lg">
                    </div>
                    <div id="password-error" class="text-red-500 text-sm hidden"></div>
                    <button type="submit" class="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600">Change Password</button>
                </form>
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
