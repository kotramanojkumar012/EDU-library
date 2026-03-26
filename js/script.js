"use strict";

const state = {
  subjects: [],
  activeSubject: null,
  searchQuery: "",
  theme: "light",
  favorites: new Set(),
  readingList: new Set(),
  activePdf: "",
  activeTitle: "",
  countersAnimated: false
};

const elements = {
  searchInput: document.getElementById("global-search"),
  subjectGrid: document.getElementById("subject-grid"),
  subjectBooksSection: document.getElementById("subject-books-section"),
  subjectBooksTitle: document.getElementById("subject-books-title"),
  subjectBookCount: document.getElementById("subject-book-count"),
  subjectBookGrid: document.getElementById("subject-book-grid"),
  subjectBooksEmpty: document.getElementById("subject-books-empty"),
  backToSubjects: document.getElementById("back-to-subjects"),
  favoritesSection: document.getElementById("favorites-section"),
  favoritesGrid: document.getElementById("favorites-grid"),
  favoritesSummary: document.getElementById("favorites-summary"),
  favoritesEmpty: document.getElementById("favorites-empty"),
  closeFavorites: document.getElementById("close-favorites"),
  readingSection: document.getElementById("reading-section"),
  readingGrid: document.getElementById("reading-grid"),
  readingSummary: document.getElementById("reading-summary"),
  readingEmpty: document.getElementById("reading-empty"),
  closeReading: document.getElementById("close-reading"),
  readerModal: document.getElementById("reader-modal"),
  readerOverlay: document.querySelector(".reader-overlay"),
  pdfFrame: document.getElementById("pdf-frame"),
  readerClose: document.getElementById("close-reader"),
  readerOpen: document.getElementById("reader-open"),
  readerDownload: document.getElementById("reader-download"),
  readerTitle: document.getElementById("reader-title"),
  toastStack: document.getElementById("toast-stack"),
  reviewForm: document.getElementById("review-form"),
  reviewFeedback: document.getElementById("review-feedback"),
  themeToggle: document.getElementById("theme-toggle"),
  favoritesCount: document.getElementById("favorites-count"),
  readingCount: document.getElementById("reading-count"),
  favoritesTrigger: document.getElementById("favorites-trigger"),
  readingTrigger: document.getElementById("reading-trigger"),
  heroCta: document.getElementById("hero-cta"),
  viewFavorites: document.getElementById("view-favorites")
};

const previewSourceMatchers = [/books\.google\./i, /scribd\.com/i];

document.addEventListener("DOMContentLoaded", initApp);

function initApp() {
  bindEvents();
  hydrateState();
  applyTheme();
  fetchSubjects();
  animateCounters();
}

function bindEvents() {
  elements.searchInput?.addEventListener("input", handleSearch);
  elements.subjectGrid?.addEventListener("click", handleSubjectClick);
  elements.subjectGrid?.addEventListener("keydown", handleSubjectGridKeydown);
  elements.subjectBookGrid?.addEventListener("click", handleBookGridClick);
  elements.favoritesGrid?.addEventListener("click", handleBookGridClick);
  elements.readingGrid?.addEventListener("click", handleBookGridClick);
  elements.backToSubjects?.addEventListener("click", resetSubjectView);
  elements.closeFavorites?.addEventListener("click", closeCollectionViews);
  elements.closeReading?.addEventListener("click", closeCollectionViews);
  elements.readerClose?.addEventListener("click", closeReader);
  elements.readerOverlay?.addEventListener("click", handleReaderOverlayClick);
  elements.readerOpen?.addEventListener("click", handleReaderOpen);
  elements.readerDownload?.addEventListener("click", handleReaderDownload);
  elements.themeToggle?.addEventListener("click", toggleTheme);
  elements.favoritesTrigger?.addEventListener("click", () => openCollectionView("favorites"));
  elements.viewFavorites?.addEventListener("click", () => openCollectionView("favorites"));
  elements.readingTrigger?.addEventListener("click", () => openCollectionView("reading"));
  elements.heroCta?.addEventListener("click", () => scrollToSection("subject-grid"));
  elements.reviewForm?.addEventListener("submit", handleReviewSubmit);
  document.addEventListener("keydown", handleKeydown);
}

function hydrateState() {
  const savedTheme = localStorage.getItem("edulibraryTheme");
  state.theme = savedTheme || "light";

  try {
    state.favorites = new Set(JSON.parse(localStorage.getItem("edulibraryFavorites") || "[]"));
  } catch (error) {
    state.favorites = new Set();
  }

  try {
    state.readingList = new Set(JSON.parse(localStorage.getItem("edulibraryReadingList") || "[]"));
  } catch (error) {
    state.readingList = new Set();
  }

  updateNavCounts();
}

async function fetchSubjects() {
  try {
    const response = await fetch("./data/books.json", { cache: "no-store" });
    const data = await response.json();
    state.subjects = normalizeSubjects(Array.isArray(data) ? data : []);
    renderSubjects();
    renderCollectionViews();
  } catch (error) {
    console.error(error);
    showToast("Unable to load subjects right now.");
  }
}

function handleSearch(event) {
  state.searchQuery = event.target.value.trim().toLowerCase();
  renderSubjects();
  if (state.activeSubject) {
    renderSubjectBooks();
  }
}

function renderSubjects() {
  const filteredSubjects = getFilteredSubjects();

  if (!filteredSubjects.length) {
    elements.subjectGrid.innerHTML = '<article class="empty-state">No subjects match your search.</article>';
    return;
  }

  elements.subjectGrid.innerHTML = filteredSubjects
    .map(
      (subject) => `
        <article class="subject-card" data-subject="${encodeURIComponent(subject.subject)}" role="button" tabindex="0" aria-label="Open ${escapeHtml(subject.subject)}">
          <p class="subject-name">${escapeHtml(subject.subject)}</p>
          <p class="subject-description">${escapeHtml(subject.description || "Core engineering focus")}</p>
          <span class="count-badge">${subject.books.length} Textbooks Available</span>
        </article>
      `
    )
    .join("");
}

function getFilteredSubjects() {
  const query = state.searchQuery;
  return state.subjects.filter((subject) => {
    const subjectText = `${subject.subject} ${subject.description || ""}`.toLowerCase();
    const matchesSubject = subjectText.includes(query);
    const matchesBook = subject.books.some((book) => {
      const bookText = `${book.title} ${book.author} ${book.edition || ""} ${book.year || ""}`.toLowerCase();
      return bookText.includes(query);
    });

    return !query || matchesSubject || matchesBook;
  });
}

function handleSubjectClick(event) {
  const card = event.target.closest(".subject-card");
  if (!card) {
    return;
  }

  const subjectName = decodeURIComponent(card.dataset.subject || "");
  const subject = state.subjects.find((item) => item.subject === subjectName);
  if (!subject) {
    return;
  }

  closeCollectionViews();
  state.activeSubject = subject;
  elements.subjectBooksTitle.textContent = subject.subject;
  elements.subjectBooksSection.classList.remove("hidden");
  renderSubjectBooks();
  elements.subjectBooksSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleSubjectGridKeydown(event) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  const card = event.target.closest(".subject-card");
  if (!card) {
    return;
  }

  event.preventDefault();
  card.click();
}

function renderSubjectBooks() {
  if (!state.activeSubject) {
    return;
  }

  const books = state.activeSubject.books.filter((book) => {
    if (!state.searchQuery) {
      return true;
    }

    const bookText = `${book.title} ${book.author} ${book.edition || ""} ${book.year || ""}`.toLowerCase();
    return bookText.includes(state.searchQuery);
  });

  elements.subjectBookGrid.innerHTML = books.map((book) => renderBookCard(book)).join("");
  elements.subjectBookCount.textContent = `${books.length} textbook${books.length === 1 ? "" : "s"} available`;
  elements.subjectBooksEmpty.classList.toggle("hidden", books.length > 0);
}

function renderBookCard(book, options = {}) {
  const metaParts = [];
  if (options.showSubject && book.subject) metaParts.push(book.subject);
  if (book.edition) metaParts.push(book.edition);
  if (book.year) metaParts.push(book.year);

  const metaText = metaParts.join(" · ");
  const rating = Number(book.rating) || 0;
  const isFavoriteCollection = options.collectionType === "favorites";
  const isReadingCollection = options.collectionType === "reading";
  const favoriteAction = isFavoriteCollection
    ? `<button data-action="remove-favorite" data-book-id="${book.id}" data-title="${encodeURIComponent(book.title)}" type="button">Remove Favorite</button>`
    : `<button data-action="favorite" data-book-id="${book.id}" data-title="${encodeURIComponent(book.title)}" type="button">Favorite</button>`;
  const readingAction = isReadingCollection
    ? `<button data-action="remove-reading" data-book-id="${book.id}" data-title="${encodeURIComponent(book.title)}" type="button">Remove from List</button>`
    : `<button data-action="reading" data-book-id="${book.id}" data-title="${encodeURIComponent(book.title)}" type="button">Reading List</button>`;
  const actionBar = `
    <div class="book-actions">
      <button class="book-action-secondary" data-action="read" data-pdf="${encodeURIComponent(book.pdf)}" data-title="${encodeURIComponent(book.title)}" type="button">Read</button>
      <button class="book-action-secondary" data-action="download" data-pdf="${encodeURIComponent(book.pdf)}" data-title="${encodeURIComponent(book.title)}" type="button">Download</button>
      <button class="book-action-primary" data-action="${isFavoriteCollection ? "remove-favorite" : "favorite"}" data-book-id="${book.id}" data-title="${encodeURIComponent(book.title)}" type="button">${isFavoriteCollection ? "Remove Favorite" : "Save Favorite"}</button>
      <button class="book-action-primary" data-action="${isReadingCollection ? "remove-reading" : "reading"}" data-book-id="${book.id}" data-title="${encodeURIComponent(book.title)}" type="button">${isReadingCollection ? "Remove from List" : "Add to Reading List"}</button>
    </div>
  `;

  return `
    <article class="book-card">
      <div class="book-cover">
        <img src="${escapeHtml(book.cover)}" alt="Cover for ${escapeHtml(book.title)}">
      </div>
      <div class="book-meta">
        <p class="book-title">${escapeHtml(book.title)}</p>
        <p class="book-author">${escapeHtml(book.author)}</p>
        <p class="book-extra">${escapeHtml(metaText)}</p>
        <p class="rating">Rating ${rating.toFixed(1)}</p>
      </div>
      ${actionBar}
    </article>
  `;
}

function handleBookGridClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.action;
  const bookId = button.dataset.bookId || "";
  const title = button.dataset.title ? decodeURIComponent(button.dataset.title) : "Book";
  const pdf = button.dataset.pdf ? decodeURIComponent(button.dataset.pdf) : "";

  if (action === "read") {
    openReader(pdf, title);
    return;
  }

  if (action === "download") {
    downloadBook(pdf, title);
    return;
  }

  if (action === "favorite") {
    toggleFavorite(bookId, title);
    return;
  }

  if (action === "reading") {
    toggleReadingList(bookId, title);
    return;
  }

  if (action === "remove-favorite") {
    removeFavorite(bookId, title);
    return;
  }

  if (action === "remove-reading") {
    removeReadingList(bookId, title);
  }
}

function toggleFavorite(bookId, title) {
  if (!bookId) {
    return;
  }

  if (state.favorites.has(bookId)) {
    showToast("Already in favorites");
    openCollectionView("favorites");
    return;
  }

  state.favorites.add(bookId);
  persistFavorites();
  updateNavCounts();
  renderCollectionViews();
  showToast(`Added "${title}" to favorites`);
  openCollectionView("favorites", { silent: true });
}

function toggleReadingList(bookId, title) {
  if (!bookId) {
    return;
  }

  if (state.readingList.has(bookId)) {
    showToast("Already in reading list");
    openCollectionView("reading");
    return;
  }

  state.readingList.add(bookId);
  persistReadingList();
  updateNavCounts();
  renderCollectionViews();
  showToast(`Saved "${title}" to reading list`);
  openCollectionView("reading", { silent: true });
}

function removeFavorite(bookId, title) {
  if (!state.favorites.has(bookId)) {
    return;
  }

  state.favorites.delete(bookId);
  persistFavorites();
  updateNavCounts();
  renderCollectionViews();
  showToast(`Removed "${title}" from favorites`);
}

function removeReadingList(bookId, title) {
  if (!state.readingList.has(bookId)) {
    return;
  }

  state.readingList.delete(bookId);
  persistReadingList();
  updateNavCounts();
  renderCollectionViews();
  showToast(`Removed "${title}" from reading list`);
}


function persistFavorites() {
  localStorage.setItem("edulibraryFavorites", JSON.stringify(Array.from(state.favorites)));
}

function persistReadingList() {
  localStorage.setItem("edulibraryReadingList", JSON.stringify(Array.from(state.readingList)));
}

function updateNavCounts() {
  elements.favoritesCount.textContent = state.favorites.size;
  elements.readingCount.textContent = state.readingList.size;
}

function renderCollectionViews() {
  renderCollectionGrid({
    ids: state.favorites,
    grid: elements.favoritesGrid,
    summary: elements.favoritesSummary,
    empty: elements.favoritesEmpty,
    label: "favorite",
    collectionType: "favorites"
  });

  renderCollectionGrid({
    ids: state.readingList,
    grid: elements.readingGrid,
    summary: elements.readingSummary,
    empty: elements.readingEmpty,
    label: "reading list",
    collectionType: "reading"
  });
}

function renderCollectionGrid(config) {
  const books = resolveBooksByIds(config.ids);
  config.grid.innerHTML = books
    .map((book) => renderBookCard(book, { showSubject: true, collectionType: config.collectionType }))
    .join("");
  config.summary.textContent = `${books.length} saved textbook${books.length === 1 ? "" : "s"}`;
  config.empty.classList.toggle("hidden", books.length > 0);

  if (!books.length) {
    config.summary.textContent = `No ${config.label} items yet`;
  }
}

function resolveBooksByIds(ids) {
  return state.subjects.flatMap((subject) =>
    subject.books
      .filter((book) => ids.has(book.id))
      .map((book) => ({
        ...book,
        subject: subject.subject
      }))
  );
}

function openCollectionView(type, options = {}) {
  closeCollectionViews();
  elements.subjectBooksSection.classList.add("hidden");
  state.activeSubject = null;
  renderCollectionViews();

  if (type === "favorites") {
    elements.favoritesSection.classList.remove("hidden");
    elements.favoritesSection.scrollIntoView({ behavior: "smooth", block: "start" });
    if (!options.silent) {
      showToast(state.favorites.size ? "Favorites ready" : "No favorites yet");
    }
    return;
  }

  elements.readingSection.classList.remove("hidden");
  elements.readingSection.scrollIntoView({ behavior: "smooth", block: "start" });
  if (!options.silent) {
    showToast(state.readingList.size ? "Reading list ready" : "Reading list is empty");
  }
}

function closeCollectionViews() {
  elements.favoritesSection.classList.add("hidden");
  elements.readingSection.classList.add("hidden");
}

function resetSubjectView() {
  state.activeSubject = null;
  elements.subjectBooksSection.classList.add("hidden");
  elements.subjectBookGrid.innerHTML = "";
  elements.subjectBookCount.textContent = "";
  elements.subjectBooksEmpty.classList.add("hidden");
  scrollToSection("subject-grid");
}

function openReader(pdfLink, title) {
  if (!pdfLink) {
    showToast("Textbook unavailable");
    return;
  }

  state.activePdf = pdfLink;
  state.activeTitle = title;
  elements.readerTitle.textContent = title;
  elements.pdfFrame.src = buildViewerUrl(pdfLink);
  elements.readerModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  showToast("Opening book...");
}

function closeReader() {
  elements.readerModal.classList.add("hidden");
  document.body.style.overflow = "";
  elements.pdfFrame.src = "";
  state.activePdf = "";
  state.activeTitle = "";
}

function normalizeSubjects(subjects) {
  return subjects
    .map((subject) => ({
      ...subject,
      books: [...(subject.books || [])].sort(compareBooksByRecency)
    }))
    .sort((left, right) => left.subject.localeCompare(right.subject));
}

function compareBooksByRecency(left, right) {
  const yearDiff = (Number(right.year) || 0) - (Number(left.year) || 0);
  if (yearDiff !== 0) {
    return yearDiff;
  }

  const leftPriority = left.edition === "Reference Edition" ? 0 : 1;
  const rightPriority = right.edition === "Reference Edition" ? 0 : 1;
  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  return String(left.title).localeCompare(String(right.title));
}

function handleReaderOverlayClick(event) {
  if (event.target.dataset.closeReader === "true") {
    closeReader();
  }
}

function handleKeydown(event) {
  if (event.key === "Escape" && !elements.readerModal.classList.contains("hidden")) {
    closeReader();
  }
}

function handleReaderOpen() {
  if (state.activePdf) {
    window.open(state.activePdf, "_blank", "noopener");
  }
}

function handleReaderDownload() {
  if (state.activePdf) {
    downloadBook(state.activePdf, state.activeTitle || "engineering-textbook");
  }
}

function downloadBook(pdfLink, title) {
  if (!pdfLink) {
    showToast("Download unavailable");
    return;
  }

  if (!isPdfSource(pdfLink)) {
    window.open(pdfLink, "_blank", "noopener");
    showToast(`Opening "${title}" in a new tab...`);
    return;
  }

  const anchor = document.createElement("a");
  anchor.href = pdfLink;
  anchor.download = `${title || "engineering-textbook"}.pdf`;
  anchor.target = "_blank";
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  showToast(`Downloading "${title}"...`);
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  elements.toastStack.appendChild(toast);

  if (elements.toastStack.childElementCount > 4) {
    elements.toastStack.firstElementChild?.remove();
  }

  window.setTimeout(() => {
    toast.remove();
  }, 2200);
}

function toggleTheme() {
  state.theme = state.theme === "light" ? "dark" : "light";
  localStorage.setItem("edulibraryTheme", state.theme);
  applyTheme();
}

function applyTheme() {
  document.body.dataset.theme = state.theme;
  const themeLabel = state.theme === "dark" ? "Light Mode" : "Dark Mode";
  const labelNode = elements.themeToggle?.querySelector(".nav-action-text");
  if (labelNode) {
    labelNode.textContent = themeLabel;
  }
  elements.themeToggle?.setAttribute("aria-label", `Enable ${themeLabel.toLowerCase()}`);
}

function scrollToSection(id) {
  const target = document.getElementById(id);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function handleReviewSubmit(event) {
  event.preventDefault();
  const message = event.target.elements.message?.value.trim();
  if (!message) {
    showToast("Please share a quick note before submitting.");
    return;
  }

  elements.reviewFeedback.textContent = "Thank you. Your feedback was received.";
  event.target.reset();
  showToast("Review submitted");
}

function buildViewerUrl(sourceUrl) {
  if (!sourceUrl) {
    return "";
  }
  return sourceUrl;
}

function isPdfSource(sourceUrl) {
  const normalized = sourceUrl.split("?")[0].toLowerCase();
  if (normalized.endsWith(".pdf")) {
    return true;
  }

  return !previewSourceMatchers.some((matcher) => matcher.test(sourceUrl));
}

function animateCounters() {
  if (state.countersAnimated) {
    return;
  }

  const cards = document.querySelectorAll(".stat-card");
  cards.forEach((card, index) => {
    card.style.animationDelay = `${index * 80}ms`;
    const target = Number(card.dataset.countTarget) || 0;
    const valueEl = card.querySelector(".stat-value");
    if (!valueEl) {
      return;
    }

    const duration = 1400;
    const startTime = performance.now();

    function update(currentTime) {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      valueEl.textContent = Math.floor(target * progress).toLocaleString("en-IN");
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  });

  state.countersAnimated = true;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
