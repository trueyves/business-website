/* Windy City Property Services: site behavior */

/*
 * FORM SETUP
 * The site is static, so form submissions go to a form service.
 * Paste each form's endpoint URL below (for example from Forminit, Basin, or Formspree).
 * The careers form needs a service whose plan accepts file uploads.
 * Until an endpoint is set, the forms show a message asking visitors to call or email.
 */
const FORM_ENDPOINTS = {
  quote: "https://usebasin.com/f/cdf0b569b39b",
  careers: "https://usebasin.com/f/451ab0d82f70"
};
const CONTACT_PHONE = "224-283-4412";
const CONTACT_EMAIL = "info@windycityps.com";
const MAX_RESUME_MB = 10;

const root = document.documentElement;

/* ---------- Hero load sequence ---------- */
let heroStarted = false;
function startHero() {
  if (heroStarted) return;
  heroStarted = true;
  void root.offsetWidth; // commit the starting state so the transition runs
  root.classList.add("is-loaded");
}
const heroImg = document.querySelector(".hero-media img");
if (heroImg && !heroImg.complete) {
  heroImg.addEventListener("load", startHero, { once: true });
  heroImg.addEventListener("error", startHero, { once: true });
  setTimeout(startHero, 1200); // don't hold the page if the photo is slow
} else {
  startHero();
}

/* ---------- Header state ---------- */
const header = document.querySelector(".site-header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

/* ---------- Mobile menu ---------- */
const menuBtn = document.querySelector(".menu-toggle");
const menu = document.getElementById("mobile-menu");
function setMenu(open) {
  menuBtn.setAttribute("aria-expanded", String(open));
  menu.hidden = !open;
  document.body.style.overflow = open ? "hidden" : "";
}
menuBtn.addEventListener("click", () => setMenu(menuBtn.getAttribute("aria-expanded") !== "true"));
menu.addEventListener("click", (e) => {
  if (e.target.closest("a, button")) setMenu(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !menu.hidden) setMenu(false);
});
window.matchMedia("(min-width: 1081px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });

/* ---------- Service bands ---------- */
const bands = [...document.querySelectorAll(".band")];
function setBand(band, open) {
  band.classList.toggle("is-open", open);
  const btn = band.querySelector(".band-toggle");
  const panel = band.querySelector(".band-panel");
  btn.setAttribute("aria-expanded", String(open));
  panel.inert = !open;
}
bands.forEach((band) => {
  setBand(band, band.classList.contains("is-open"));
  band.querySelector(".band-toggle").addEventListener("click", () => {
    const willOpen = !band.classList.contains("is-open");
    bands.forEach((b) => setBand(b, b === band ? willOpen : false));
    if (willOpen) {
      // keep the opened band's heading in view once neighbors collapse
      setTimeout(() => {
        const top = band.getBoundingClientRect().top;
        const headerH = header.offsetHeight;
        if (top < headerH || top > window.innerHeight * 0.6) {
          window.scrollTo({ top: window.scrollY + top - headerH, behavior: "smooth" });
        }
      }, 380);
    }
  });
});

/* ---------- Quote drawer ---------- */
const drawer = document.getElementById("quote-drawer");
const serviceSelect = document.getElementById("q-service");
let lastTrigger = null;

function openQuote(service) {
  lastTrigger = document.activeElement;
  if (service) {
    const match = [...serviceSelect.options].find((o) => o.text === service || o.value === service);
    if (match) serviceSelect.value = match.value || match.text;
  }
  drawer.showModal();
  document.body.classList.add("drawer-open");
  setTimeout(() => document.getElementById("q-first").focus({ preventScroll: true }), 60);
}
function closeQuote() {
  drawer.close();
}
drawer.addEventListener("close", () => {
  document.body.classList.remove("drawer-open");
  if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus({ preventScroll: true });
});
document.addEventListener("click", (e) => {
  const opener = e.target.closest("[data-open-quote]");
  if (opener) {
    e.preventDefault();
    openQuote(opener.dataset.service);
    return;
  }
  if (e.target.closest("[data-close-quote]")) closeQuote();
});
// close when clicking the dimmed backdrop
drawer.addEventListener("click", (e) => {
  if (e.target === drawer) closeQuote();
});

/* ---------- Resume picker ---------- */
const resumeInput = document.getElementById("c-resume");
const fileLabel = document.querySelector("[data-file-label]");
const fileDrop = document.querySelector(".file-drop");
if (resumeInput) {
  resumeInput.addEventListener("change", () => {
    const f = resumeInput.files[0];
    fileLabel.textContent = f ? f.name : "Choose a file or drag it here";
  });
  ["dragenter", "dragover"].forEach((t) => resumeInput.addEventListener(t, () => fileDrop.classList.add("is-over")));
  ["dragleave", "drop"].forEach((t) => resumeInput.addEventListener(t, () => fileDrop.classList.remove("is-over")));
}

/* ---------- Validation and submission ---------- */
const messages = {
  valueMissing: "This field is required.",
  typeMismatch: "Enter a valid email address.",
  rangeUnderflow: "Enter the approximate square footage (100 or more).",
  badInput: "Enter a number."
};

function clearError(field) {
  field.classList.remove("has-error");
  field.querySelector(".field-error")?.remove();
}
function showError(field, text) {
  clearError(field);
  field.classList.add("has-error");
  const p = document.createElement("p");
  p.className = "field-error";
  p.textContent = text;
  field.appendChild(p);
}
function validate(form) {
  let firstBad = null;
  form.querySelectorAll(".field").forEach((field) => {
    const input = field.querySelector("input, select, textarea");
    if (!input) return;
    clearError(field);
    let text = "";
    if (!input.checkValidity()) {
      const v = input.validity;
      text = v.valueMissing ? (input.type === "file" ? "Attach your resume." : messages.valueMissing)
        : v.typeMismatch ? messages.typeMismatch
        : v.rangeUnderflow ? messages.rangeUnderflow
        : v.badInput ? messages.badInput
        : "Check this field.";
    } else if (input.type === "tel" && input.value && input.value.replace(/\D/g, "").length < 10) {
      text = "Enter a 10-digit phone number.";
    } else if (input.type === "file" && input.files[0] && input.files[0].size > MAX_RESUME_MB * 1024 * 1024) {
      text = `That file is over ${MAX_RESUME_MB} MB. Attach a smaller file.`;
    }
    if (text) {
      showError(field, text);
      firstBad ||= input;
    }
  });
  if (firstBad) firstBad.focus();
  return !firstBad;
}

document.querySelectorAll("form[data-form]").forEach((form) => {
  const status = form.querySelector(".form-status");
  const submit = form.querySelector('[type="submit"]');
  const idleLabel = submit.textContent;

  form.addEventListener("input", (e) => {
    const field = e.target.closest(".field");
    if (field && field.classList.contains("has-error")) clearError(field);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.className = "form-status";
    status.textContent = "";
    if (!validate(form)) return;

    const endpoint = FORM_ENDPOINTS[form.dataset.form];
    if (!endpoint) {
      status.classList.add("is-error");
      status.textContent = `Online requests aren't connected yet. Please call ${CONTACT_PHONE} or email ${CONTACT_EMAIL}.`;
      return;
    }

    submit.disabled = true;
    submit.textContent = "Sending...";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      if (fileLabel && form.contains(fileLabel)) fileLabel.textContent = "Choose a file or drag it here";
      status.classList.add("is-success");
      status.textContent = form.dataset.form === "quote"
        ? "Quote request sent. We'll be in touch soon to talk through your quote."
        : "Application sent. Thank you for your interest in joining our team.";
    } catch (err) {
      status.classList.add("is-error");
      status.textContent = `Your request didn't go through. Try again, or call ${CONTACT_PHONE}.`;
    } finally {
      submit.disabled = false;
      submit.textContent = idleLabel;
    }
  });
});

/* ---------- Footer year ---------- */
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
