/* =========================================================================
   Ethan Fong — Inquiry Quiz
   Vanilla JS, progressive one-question-at-a-time quiz with Web3Forms email
   submission. No frameworks, no build step.
   ========================================================================= */
(function () {
  "use strict";

  /* -----------------------------------------------------------------------
     WEB3FORMS ACCESS KEY
     Paste your real, free access key from https://web3forms.com here.
     Until you replace this placeholder, submissions WILL fail (the error
     screen with a Retry button is shown — this is expected).
     ----------------------------------------------------------------------- */
  const WEB3FORMS_ACCESS_KEY = "[YOUR_WEB3FORMS_ACCESS_KEY]";

  /* -----------------------------------------------------------------------
     QUIZ DATA — edit these question objects to change the quiz.
     Types: "choice" | "textarea" | "text" | "group"
     ----------------------------------------------------------------------- */
  const QUESTIONS = [
    {
      id: "hasCoach",
      type: "choice",
      prompt: "Do you currently have a personal jumps coach?",
      options: ["Yes", "No"],
      required: true,
    },
    {
      id: "blockers",
      type: "textarea",
      prompt: "What's holding you back right now?",
      required: true,
    },
    {
      id: "marks",
      type: "text",
      prompt: "What are your current marks? (event + distance)",
      placeholder: "e.g. Long jump 16'2\", Triple jump 34'",
      required: true,
    },
    {
      id: "athlete",
      type: "group",
      prompt: "Athlete name & grade/age?",
      fields: [
        { name: "athleteName", label: "Athlete name", required: true },
        { name: "athleteGrade", label: "Grade / age", required: true },
      ],
    },
    {
      id: "contact",
      type: "group",
      prompt: "Parent/guardian contact info",
      note:
        "Film and video review is handled privately after Ethan reaches out — no upload needed here.",
      fields: [
        { name: "parentName", label: "Name", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone", type: "tel", required: true },
      ],
    },
  ];

  /* -----------------------------------------------------------------------
     DOM hooks (must exist in index.html). Guard: bail if no form present,
     since this script is loaded site-wide.
     ----------------------------------------------------------------------- */
  const form = document.getElementById("quizForm");
  if (!form) return;

  const stepRegion = document.getElementById("quizStepRegion");
  const progressFill = document.getElementById("quizProgressFill");
  const progressText = document.getElementById("quizProgressText");
  const progressWrap = document.querySelector(".quiz-progress");
  const backBtn = document.getElementById("quizBack");
  const nextBtn = document.getElementById("quizNext");
  const nav = document.getElementById("quizNav");
  const doneScreen = document.getElementById("quizDone");
  const honeypot = document.getElementById("botcheck");

  /* -----------------------------------------------------------------------
     STATE — answers are keyed. Choice/text/textarea store a single string
     under the question id; group stores each field name individually.
     ----------------------------------------------------------------------- */
  const state = {};
  let currentIndex = 0;
  let submitting = false;

  const total = QUESTIONS.length;

  /* Basic validators */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function isValidEmail(v) {
    return EMAIL_RE.test(String(v || "").trim());
  }
  function hasEnoughDigits(v) {
    return (String(v || "").match(/\d/g) || []).length >= 7;
  }

  /* Small helper: create an element with attributes + text */
  function el(tag, attrs, text) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => node.setAttribute(k, attrs[k]));
    }
    if (text != null) node.textContent = text;
    return node;
  }

  /* -----------------------------------------------------------------------
     RENDER a single step into the step region.
     ----------------------------------------------------------------------- */
  function renderStep(index) {
    const q = QUESTIONS[index];
    clearGlobalError();
    stepRegion.innerHTML = "";

    // Heading (the prompt)
    const heading = el("h3", { class: "quiz-question", tabindex: "-1" }, q.prompt);
    heading.id = `q-${q.id}-label`;
    stepRegion.appendChild(heading);

    if (q.help) {
      stepRegion.appendChild(el("p", { class: "quiz-help" }, q.help));
    }

    let firstFocusable = null;

    if (q.type === "choice") {
      const group = el("div", { class: "choice-group", role: "group", "aria-labelledby": heading.id });
      q.options.forEach((opt) => {
        const selected = state[q.id] === opt;
        const btn = el("button", {
          type: "button",
          class: "choice-btn" + (selected ? " selected" : ""),
          "aria-pressed": selected ? "true" : "false",
        }, opt);
        btn.addEventListener("click", () => {
          state[q.id] = opt;
          // Update pressed/selected state across the group
          group.querySelectorAll(".choice-btn").forEach((b) => {
            const on = b === btn;
            b.classList.toggle("selected", on);
            b.setAttribute("aria-pressed", on ? "true" : "false");
          });
          clearFieldError(group);
        });
        if (!firstFocusable) firstFocusable = btn;
        group.appendChild(btn);
      });
      stepRegion.appendChild(group);
    } else if (q.type === "textarea") {
      const inputId = `q-${q.id}`;
      stepRegion.appendChild(el("label", { for: inputId, class: "quiz-label" }, q.prompt));
      const ta = el("textarea", { id: inputId, class: "quiz-input", rows: "4" });
      if (q.placeholder) ta.setAttribute("placeholder", q.placeholder);
      ta.value = state[q.id] || "";
      ta.addEventListener("input", () => {
        state[q.id] = ta.value;
        clearFieldError(ta);
      });
      firstFocusable = ta;
      stepRegion.appendChild(ta);
    } else if (q.type === "text") {
      const inputId = `q-${q.id}`;
      stepRegion.appendChild(el("label", { for: inputId, class: "quiz-label" }, q.prompt));
      const input = el("input", { id: inputId, type: "text", class: "quiz-input" });
      if (q.placeholder) input.setAttribute("placeholder", q.placeholder);
      input.value = state[q.id] || "";
      input.addEventListener("input", () => {
        state[q.id] = input.value;
        clearFieldError(input);
      });
      firstFocusable = input;
      stepRegion.appendChild(input);
    } else if (q.type === "group") {
      q.fields.forEach((f) => {
        const wrap = el("div", { class: "quiz-field" });
        const inputId = `q-${f.name}`;
        wrap.appendChild(el("label", { for: inputId, class: "quiz-label" }, f.label));
        const input = el("input", {
          id: inputId,
          type: f.type || "text",
          class: "quiz-input",
          name: f.name,
        });
        input.value = state[f.name] || "";
        input.addEventListener("input", () => {
          state[f.name] = input.value;
          clearFieldError(input);
        });
        if (!firstFocusable) firstFocusable = input;
        wrap.appendChild(input);
        stepRegion.appendChild(wrap);
      });
      if (q.note) {
        stepRegion.appendChild(el("p", { class: "quiz-note" }, q.note));
      }
    }

    updateChrome(index);

    // Accessibility: move focus to the heading (or first input) after render.
    (heading || firstFocusable).focus();
  }

  /* Update progress bar, text, and nav button labels/visibility */
  function updateChrome(index) {
    const pct = ((index + 1) / total) * 100;
    if (progressFill) progressFill.style.width = `${pct}%`;
    if (progressText) progressText.textContent = `Question ${index + 1} of ${total}`;

    if (backBtn) {
      if (index === 0) backBtn.setAttribute("hidden", "");
      else backBtn.removeAttribute("hidden");
    }
    if (nextBtn) {
      nextBtn.textContent = index === total - 1 ? "Submit" : "Next";
    }
  }

  /* -----------------------------------------------------------------------
     FIELD-LEVEL error helpers.
     ----------------------------------------------------------------------- */
  function showFieldError(afterNode, message) {
    // Insert a .field-error right after the offending control.
    let err = afterNode.nextElementSibling;
    if (!err || !err.classList.contains("field-error")) {
      err = el("p", { class: "field-error", role: "alert" });
      afterNode.parentNode.insertBefore(err, afterNode.nextSibling);
    }
    err.textContent = message;
    err.hidden = false;
  }
  function clearFieldError(afterNode) {
    const err = afterNode.nextElementSibling;
    if (err && err.classList.contains("field-error")) {
      err.hidden = true;
      err.textContent = "";
    }
  }
  function clearAllFieldErrors() {
    stepRegion.querySelectorAll(".field-error").forEach((e) => {
      e.hidden = true;
      e.textContent = "";
    });
  }

  /* -----------------------------------------------------------------------
     VALIDATE the current step. Returns true if OK; otherwise shows inline
     errors, focuses the first invalid control, and returns false.
     ----------------------------------------------------------------------- */
  function validateStep(index) {
    const q = QUESTIONS[index];
    clearAllFieldErrors();
    let firstInvalid = null;

    if (q.type === "choice") {
      if (q.required && !state[q.id]) {
        const group = stepRegion.querySelector(".choice-group");
        showFieldError(group, "Please choose an option.");
        firstInvalid = group.querySelector(".choice-btn");
      }
    } else if (q.type === "text" || q.type === "textarea") {
      const control = stepRegion.querySelector(".quiz-input");
      const val = (state[q.id] || "").trim();
      if (q.required && !val) {
        showFieldError(control, "This field is required.");
        firstInvalid = control;
      }
    } else if (q.type === "group") {
      q.fields.forEach((f) => {
        const control = stepRegion.querySelector(`#q-${f.name}`);
        const val = (state[f.name] || "").trim();
        let msg = null;
        if (f.required && !val) {
          msg = "This field is required.";
        } else if (val && f.type === "email" && !isValidEmail(val)) {
          msg = "Please enter a valid email address.";
        } else if (val && f.type === "tel" && !hasEnoughDigits(val)) {
          msg = "Please enter a valid phone number.";
        }
        if (msg) {
          showFieldError(control, msg);
          if (!firstInvalid) firstInvalid = control;
        }
      });
    }

    if (firstInvalid) {
      firstInvalid.focus();
      return false;
    }
    return true;
  }

  /* -----------------------------------------------------------------------
     GLOBAL (submit) error box — created dynamically near the nav.
     ----------------------------------------------------------------------- */
  function clearGlobalError() {
    const existing = form.querySelector(".quiz-error");
    if (existing) existing.remove();
  }
  function showGlobalError(message, onRetry) {
    clearGlobalError();
    const box = el("div", { class: "quiz-error", role: "alert" });
    box.appendChild(el("p", { class: "quiz-error-msg" }, message));
    const retry = el("button", { type: "button", class: "btn btn-primary" }, "Retry");
    retry.addEventListener("click", () => {
      box.remove();
      onRetry();
    });
    box.appendChild(retry);
    // Insert near the nav (before it) so it sits with the controls.
    if (nav && nav.parentNode) {
      nav.parentNode.insertBefore(box, nav);
    } else {
      form.appendChild(box);
    }
    retry.focus();
  }

  /* -----------------------------------------------------------------------
     SUBMISSION (Web3Forms).
     ----------------------------------------------------------------------- */
  function buildPayload() {
    const athleteName = (state.athleteName || "").trim();
    return {
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: `New coaching inquiry — ${athleteName || "Athlete"}`,
      from_name: athleteName || "Website inquiry quiz",
      "Has coach": state.hasCoach || "",
      "What's holding them back": state.blockers || "",
      "Current marks": state.marks || "",
      "Athlete name": athleteName,
      "Grade/age": (state.athleteGrade || "").trim(),
      "Parent name": (state.parentName || "").trim(),
      Email: (state.email || "").trim(),
      Phone: (state.phone || "").trim(),
    };
  }

  function setSubmitting(on) {
    submitting = on;
    if (!nextBtn) return;
    nextBtn.disabled = on;
    if (on) {
      nextBtn.dataset.label = nextBtn.textContent;
      nextBtn.textContent = "Sending…";
    } else {
      nextBtn.textContent = nextBtn.dataset.label || "Submit";
    }
  }

  function showDone() {
    if (form) form.setAttribute("hidden", "");
    if (progressWrap) progressWrap.setAttribute("hidden", "");
    if (doneScreen) {
      doneScreen.removeAttribute("hidden");
      const h = doneScreen.querySelector("h3") || doneScreen;
      h.setAttribute("tabindex", "-1");
      h.focus();
      doneScreen.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  async function submitQuiz() {
    // Honeypot: if filled, silently treat as done (likely a bot).
    if (honeypot && honeypot.value) {
      showDone();
      return;
    }

    clearGlobalError();
    setSubmitting(true);

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(buildPayload()),
      });

      let json = null;
      try {
        json = await res.json();
      } catch (_) {
        json = null;
      }

      if (res.ok && json && json.success === true) {
        setSubmitting(false);
        showDone();
      } else {
        setSubmitting(false);
        const msg =
          (json && json.message) ||
          "Something went wrong sending your inquiry. Please try again.";
        showGlobalError(msg, submitQuiz);
      }
    } catch (err) {
      // Expected while the access key is a placeholder — render gracefully.
      setSubmitting(false);
      showGlobalError(
        "We couldn't reach the server. Please check your connection and try again.",
        submitQuiz
      );
    }
  }

  /* -----------------------------------------------------------------------
     NAVIGATION
     ----------------------------------------------------------------------- */
  function goNext() {
    if (submitting) return;
    if (!validateStep(currentIndex)) return;

    if (currentIndex < total - 1) {
      currentIndex += 1;
      renderStep(currentIndex);
    } else {
      submitQuiz();
    }
  }

  function goBack() {
    if (submitting) return;
    if (currentIndex > 0) {
      currentIndex -= 1;
      renderStep(currentIndex);
    }
  }

  if (nextBtn) nextBtn.addEventListener("click", goNext);
  if (backBtn) backBtn.addEventListener("click", goBack);

  // Prevent implicit form submission (e.g. Enter key) from reloading the page.
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    goNext();
  });

  /* Kick things off */
  renderStep(currentIndex);
})();
