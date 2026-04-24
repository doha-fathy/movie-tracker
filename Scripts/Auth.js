const AUTH_URL = "Auth.php";

function sanitizeString(input) {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .trim();
}

function isValidEmail(email) {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && !/<>'"/.test(email);
}
async function register(firstName, lastName, username, email, password) {
  try {
    const params = new URLSearchParams();
    params.append("first_name", sanitizeString(firstName));
    params.append("last_name", sanitizeString(lastName));
    params.append("username", sanitizeString(username));
    params.append("email", sanitizeString(email).toLowerCase());
    params.append("password", password);

    const response = await fetch(AUTH_URL + "?action=register", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!data.success) {
      return { success: false, error: data.message };
    }

    return {
      success: true,
      user: {
        id: data.data.user_id,
        username: data.data.username,
      },
    };
  } catch (error) {
    return { success: false, error: "Network error" };
  }
}

async function login(email, password) {
  try {
    const params = new URLSearchParams();
    params.append("email", sanitizeString(email).toLowerCase());
    params.append("password", password);

    const response = await fetch(AUTH_URL + "?action=login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!data.success) {
      return { success: false, error: data.message };
    }

    return {
      success: true,
      user: data.data,
    };
  } catch (error) {
    return { success: false, error: "Network error occurred" };
  }
}

async function checkAuthStatus() {
  try {
    const response = await fetch(AUTH_URL + "?action=check");
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
      user: result.user,
    };
  } catch (error) {
    return { authenticated: false };
  }
}

function renderRegisterForm(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="flex justify-center items-center min-h-screen px-4 py-12">
        <div class="w-full max-w-md rounded-2xl overflow-hidden auth-card">

            <div class="relative h-24 flex items-center justify-center auth-banner">
                <div class="absolute inset-0 auth-banner-glow"></div>
                <h2 class="relative text-2xl font-bold text-white z-10">Create Account</h2>
            </div>

            <div class="px-8 py-8">
                <form id="register-form" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold mb-2 tracking-wider auth-label">First Name</label>
                            <input type="text" name="first_name" required class="w-full px-4 py-2.5 rounded-lg text-sm auth-input">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold mb-2 tracking-wider auth-label">Last Name</label>
                            <input type="text" name="last_name" class="w-full px-4 py-2.5 rounded-lg text-sm auth-input">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold mb-2 tracking-wider auth-label">Username</label>
                        <input type="text" name="username" required class="w-full px-4 py-2.5 rounded-lg text-sm auth-input">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold mb-2 tracking-wider auth-label">Email</label>
                        <input type="email" name="email" required class="w-full px-4 py-2.5 rounded-lg text-sm auth-input">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold mb-2 tracking-wider auth-label">Password</label>
                        <input type="password" name="password" required minlength="6" class="w-full px-4 py-2.5 rounded-lg text-sm auth-input">
                    </div>
                    <div id="register-error" class="text-red-400 text-sm font-semibold hidden"></div>
                    <button type="submit" class="w-full py-2.5 rounded-lg text-white text-sm font-semibold transition-all duration-200 border-2 border-transparent bg-[#C1246B] hover:bg-transparent hover:border-[#C1246B]">
                        Create Account
                    </button>
                </form>
                <p class="text-center text-sm mt-5 auth-footer-text">
                    Already have an account?
                    <a href="javascript:void(0)" onclick="showLoginForm()" class="font-semibold hover:underline auth-footer-link">Login</a>
                </p>
            </div>
        </div>
    </div>
`;
  document
    .getElementById("register-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const firstName = formData.get("first_name");
      const lastName = formData.get("last_name");
      const username = formData.get("username");
      const email = formData.get("email");
      const password = formData.get("password");

      const errorDiv = document.getElementById("register-error");

      errorDiv.classList.add("hidden");

      const result = await register(
        firstName,
        lastName,
        username,
        email,
        password,
      );

      if (result.success) {
        await window.updateUIForAuth();
      } else {
        errorDiv.textContent = result.error || "Registration failed";
        errorDiv.classList.remove("hidden");
      }
    });
}

function renderLoginForm(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="flex justify-center items-center min-h-screen px-4">
        <div class="w-full max-w-md rounded-2xl overflow-hidden auth-card">

            <div class="relative h-24 flex items-center justify-center auth-banner">
                <div class="absolute inset-0 auth-banner-glow"></div>
                <h2 class="relative text-2xl font-bold text-white z-10">Welcome Back</h2>
            </div>

            <div class="px-8 py-8 space-y-5">
                <form id="login-form" class="space-y-4">
                    <div>
                        <label class="block text-xs font-semibold mb-2 tracking-wider auth-label">Email</label>
                        <input type="email" name="email" required class="w-full px-4 py-2.5 rounded-lg text-sm auth-input">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold mb-2 tracking-wider auth-label">Password</label>
                        <input type="password" name="password" required class="w-full px-4 py-2.5 rounded-lg text-sm auth-input">
                    </div>
                    <div id="login-error" class="text-red-400 text-sm font-semibold hidden"></div>
                    <button type="submit" class="w-full py-2.5 rounded-lg text-white text-sm font-semibold transition-all duration-200 border-2 border-transparent bg-[#C1246B] hover:bg-transparent hover:border-[#C1246B]">
                        Login
                    </button>
                </form>
                <p class="text-center text-sm auth-footer-text">
                    Don't have an account?
                    <a href="javascript:void(0)" onclick="showRegisterForm()" class="font-semibold hover:underline auth-footer-link">Register</a>
                </p>
            </div>
        </div>
    </div>
`;

  document
    .getElementById("login-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const email = formData.get("email");
      const password = formData.get("password");

      const errorDiv = document.getElementById("login-error");
      errorDiv.classList.add("hidden");

      const result = await login(email, password);

      if (result.success) {
        await window.updateUIForAuth();
      } else {
        errorDiv.textContent = result.error || "Login failed";
        errorDiv.classList.remove("hidden");
      }
    });
}

function showLoginForm() {
  renderLoginForm("auth-container");
}

function showRegisterForm() {
  renderRegisterForm("auth-container");
}

window.Auth = {
  register,
  login,
  checkAuthStatus,
  renderLoginForm,
  renderRegisterForm,
  showLoginForm,
  showRegisterForm,
};
