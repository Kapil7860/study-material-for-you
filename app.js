// Add your Supabase Project URL and anon/public key. Never use the service_role key here.
const SUPABASE_URL = "https://apwlcxjeknnekcpjvvbb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qhw2c-2kGtf3jI-HpgH_ug_QosGpYsy";
const BUCKET = "private-videos";

const $ = id => document.getElementById(id);
const configured = !SUPABASE_URL.startsWith("YOUR_") && !SUPABASE_ANON_KEY.startsWith("YOUR_");
const supabaseClient = configured ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
let authMode = "login";
let currentUser = null;

function openModal(mode = "login") {
  setAuthMode(mode);
  $("auth-modal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  setTimeout(() => $("email").focus(), 50);
}
function closeModal() {
  $("auth-modal").classList.add("hidden");
  document.body.style.overflow = "";
}
function setAuthMode(mode) {
  authMode = mode;
  $("tab-login").classList.toggle("active", mode === "login");
  $("tab-signup").classList.toggle("active", mode === "signup");
  $("modal-title").innerHTML = mode === "login" ? "Your collection<br><em>awaits.</em>" : "Request your<br><em>invitation.</em>";
  $("modal-subtitle").textContent = mode === "login" ? "Log in to enter your private space." : "Create an account. The owner will review your request.";
  $("submit-label").textContent = mode === "login" ? "Enter the collection" : "Send access request";
  $("password").autocomplete = mode === "login" ? "current-password" : "new-password";
  $("auth-message").textContent = "";
}
function showGate(kind) {
  $("guest-gate").classList.toggle("hidden", kind !== "guest");
  $("pending-gate").classList.toggle("hidden", kind !== "pending");
  $("approved-library").classList.toggle("hidden", kind !== "approved");
}
function setProfile(user, status) {
  currentUser = user;
  $("guest-actions").classList.add("hidden");
  $("user-menu").classList.remove("hidden");
  const email = user.email || "Signed-in member";
  $("profile-email").textContent = email;
  $("profile-short").textContent = email.split("@")[0].slice(0, 16);
  $("avatar-letter").textContent = email.charAt(0).toUpperCase();
  $("profile-status-text").textContent = status === "approved" ? "Access approved" : status === "blocked" ? "Access blocked" : "Access pending";
  $("profile-status").style.opacity = status === "approved" ? "1" : ".8";
}
function setGuest() {
  currentUser = null;
  $("guest-actions").classList.remove("hidden");
  $("user-menu").classList.add("hidden");
  $("profile-popover").classList.add("hidden");
  $("profile-trigger").setAttribute("aria-expanded", "false");
}
function showSetupMessage() {
  $("auth-message").textContent = "Website setup is not connected yet. Add your Supabase project URL and anon key in app.js first.";
}
async function refreshAccess() {
  if (!configured) return;
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    setGuest(); showGate("guest"); return;
  }
  const { data: profile, error } = await supabaseClient.from("profiles").select("status").eq("id", user.id).single();
  const status = error || !profile ? "pending" : profile.status;
  setProfile(user, status);
  if (status === "approved") {
    showGate("approved");
    await loadVideos();
  } else {
    showGate("pending");
  }
}
async function loadVideos() {
  const grid = $("video-grid");
  grid.replaceChildren();
  $("library-message").textContent = "Preparing your private collection…";
  const { data, error } = await supabaseClient.from("videos").select("id,title,description,storage_path").order("created_at", { ascending: false });
  if (error) {
    $("library-message").textContent = "Could not load videos. Please refresh and try again.";
    return;
  }
  if (!data || data.length === 0) {
    $("video-count").textContent = "0 VIDEOS";
    $("library-message").textContent = "Your private library is ready. Videos will appear here once added by the owner.";
    return;
  }
  $("video-count").textContent = `${String(data.length).padStart(2, "0")} VIDEOS`;
  $("library-message").textContent = "";
  let playable = 0;
  for (const item of data) {
    const { data: signed, error: signedError } = await supabaseClient.storage.from(BUCKET).createSignedUrl(item.storage_path, 300);
    if (signedError || !signed?.signedUrl) continue;
    playable++;
    const card = document.createElement("article"); card.className = "video-card";
    const video = document.createElement("video"); video.controls = true; video.preload = "metadata"; video.playsInline = true; video.src = signed.signedUrl;
    const info = document.createElement("div"); info.className = "video-info";
    const number = document.createElement("div"); number.className = "video-index"; number.textContent = `FILM ${String(playable).padStart(2, "0")}`;
    const title = document.createElement("h4"); title.textContent = item.title;
    const desc = document.createElement("p"); desc.textContent = item.description || "A moment from your private collection.";
    info.append(number, title, desc); card.append(video, info); grid.append(card);
  }
  if (!playable) $("library-message").textContent = "No playable videos found. Check that the storage paths match the uploaded files.";
}
async function signOut() {
  if (supabaseClient) await supabaseClient.auth.signOut();
  setGuest(); showGate("guest"); closeModal();
  window.location.hash = "home";
}
$("open-login").addEventListener("click", () => openModal("login"));
$("open-signup").addEventListener("click", () => openModal("signup"));
$("hero-cta").addEventListener("click", () => currentUser ? (window.location.hash = "collection") : openModal("login"));
$("gate-login").addEventListener("click", () => openModal("login"));
$("gate-signup").addEventListener("click", () => openModal("signup"));
$("tab-login").addEventListener("click", () => setAuthMode("login"));
$("tab-signup").addEventListener("click", () => setAuthMode("signup"));
$("close-modal").addEventListener("click", closeModal);
$("auth-modal").addEventListener("click", e => { if (e.target === $("auth-modal")) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
$("profile-trigger").addEventListener("click", () => {
  const open = $("profile-popover").classList.toggle("hidden") === false;
  $("profile-trigger").setAttribute("aria-expanded", String(open));
});
$("profile-logout").addEventListener("click", signOut);
$("pending-refresh").addEventListener("click", refreshAccess);
$("mobile-menu").addEventListener("click", () => $("main-nav")?.classList.toggle("open"));
document.querySelectorAll(".main-nav a").forEach(link => link.addEventListener("click", () => $("main-nav").classList.remove("open")));

$("auth-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (!configured) { showSetupMessage(); return; }
  const button = $("submit-btn");
  button.disabled = true;
  const email = $("email").value.trim();
  const password = $("password").value;
  let result;
  if (authMode === "login") {
    result = await supabaseClient.auth.signInWithPassword({ email, password });
  } else {
    result = await supabaseClient.auth.signUp({ email, password });
  }
  button.disabled = false;
  if (result.error) {
    $("auth-message").textContent = result.error.message;
    return;
  }
  if (authMode === "signup") {
    $("auth-message").textContent = "Request created. Verify your email if asked. Your access will unlock after owner approval.";
    return;
  }
  closeModal();
  await refreshAccess();
});

async function init() {
  showGate("guest");
  if (!configured) {
    setGuest();
    return;
  }
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session?.user) await refreshAccess();
  supabaseClient.auth.onAuthStateChange((_event, sessionNow) => {
    if (!sessionNow) { setGuest(); showGate("guest"); }
  });
}
init();
