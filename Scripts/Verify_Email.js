async function renderVerifyEmailPage(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
        <div class="min-h-screen flex items-center justify-center px-4">
            <div class="bg-white/5 border border-white/10 rounded-2xl p-10 text-center w-full max-w-sm">
                <div class="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-5">
                    <div class="w-7 h-7 border-4 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
                </div>
                <h2 class="text-white text-xl font-bold mb-2">Verifying your email...</h2>
                <p class="text-white/50 text-sm">Please wait a moment.</p>
            </div>
        </div>
    `;

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (!token) {
    showVerifyState(container, "error", "No verification token found.");
    return;
  }

  try {
    const res = await fetch(
      `auth.php?action=verify_email&token=${encodeURIComponent(token)}`,
    );
    const data = await res.json();

    if (data.success) {
      showVerifyState(container, "success");
    } else {
      showVerifyState(
        container,
        "error",
        data.message || "This link may be expired or already used.",
      );
    }
  } catch {
    showVerifyState(container, "error", "Network error. Please try again.");
  }
}

function showVerifyState(container, state, message = "") {
  const isSuccess = state === "success";

  const iconBg = isSuccess ? "bg-green-900/40" : "bg-red-900/30";
  const iconColor = isSuccess ? "text-green-400" : "text-red-400";
  const icon = isSuccess ? "fa-circle-check" : "fa-circle-xmark";
  const title = isSuccess ? "Email verified!" : "Verification failed";
  const body = isSuccess
    ? "Your account is now active. You can log in."
    : message;
  const btnLabel = isSuccess ? "Go to login" : "Back to home";
  const btnPage = isSuccess ? "login" : "movies";

  container.innerHTML = `
        <div class="min-h-screen flex items-center justify-center px-4">
            <div class="bg-white/5 border border-white/10 rounded-2xl p-10 text-center w-full max-w-sm">

                <div class="w-16 h-16 rounded-full ${iconBg} flex items-center justify-center mx-auto mb-5">
                    <i class="fa-solid ${icon} ${iconColor} text-3xl"></i>
                </div>

                <h2 class="text-white text-xl font-bold mb-2">${title}</h2>
                <p class="text-white/50 text-sm mb-6">${body}</p>

                <button
                    onclick="navigateTo('${btnPage}')"
                    class="px-6 py-2 rounded-lg border border-[#C1246B]/20 text-white text-sm bg-[#C1246B]  hover:bg-transparent hover:border-[#C1246B] font-semibold transition-colors duration-200 cursor-pointer"
                >
                    ${btnLabel}
                </button>

            </div>
        </div>
    `;
}
