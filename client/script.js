(function () {
    "use strict";

    const curriculum = window.EXAMFORGE_CURRICULUM;
    if (!curriculum || !curriculum.branches) {
        throw new Error("ExamForge curriculum data could not be loaded.");
    }

    const branches = curriculum.branches;
    const state = {
        view: "departments",
        branch: "",
        year: 0,
        semester: 0,
        filter: "all",
        papers: []
    };

    const elements = {
        title: document.getElementById("view-title"),
        description: document.getElementById("view-description"),
        source: document.getElementById("syllabus-source"),
        breadcrumb: document.getElementById("breadcrumb"),
        departmentGrid: document.getElementById("department-grid"),
        yearGrid: document.getElementById("year-grid"),
        semesterGrid: document.getElementById("semester-grid"),
        subjectsContainer: document.getElementById("subjects-container"),
        subjectResultCount: document.getElementById("subject-result-count"),
        searchForm: document.getElementById("search-form"),
        searchInput: document.getElementById("search-input"),
        searchDialog: document.getElementById("search-dialog"),
        searchTitle: document.getElementById("search-title"),
        searchResults: document.getElementById("search-results"),
        menuToggle: document.getElementById("menu-toggle"),
        mobileNav: document.getElementById("mobile-nav")
    };

    const viewIds = ["departments-view", "years-view", "semesters-view", "subjects-view"];
    const categoryDescriptions = {
        DCC: "Core course in the official branch curriculum.",
        BAS: "Basic and applied sciences curriculum course.",
        HMC: "Humanities, management and professional development course.",
        OEC: "Open elective slot; the offered subject can vary by batch.",
        GEC: "Generic elective slot selected from the university basket.",
        DEC: "Departmental elective slot; offerings can change by semester.",
        Project: "Practical training, internship or project component."
    };

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
    }

    function normalizeCode(value) {
        return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    }

    // Curriculum entries can combine alternatives ("BMA 110 / BEC 110"); a paper
    // filed under either code belongs to that entry.
    function codeKeys(code) {
        const parts = String(code || "").split("/").map(normalizeCode).filter(Boolean);
        return [normalizeCode(code), ...parts];
    }

    function ordinal(value) {
        const labels = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
        return labels[value] || `${value}th`;
    }

    function yearForSemester(semester) {
        return Math.ceil(Number(semester) / 2);
    }

    function subjectEntries(branchId, semester) {
        const branch = branches[branchId];
        return branch && branch.semesters[semester] ? branch.semesters[semester] : [];
    }

    // Curriculum lists electives as placeholders ("Departmental Elective I"), so an
    // elective with papers in the catalogue (e.g. BAI 322) is added as its own entry.
    function subjectEntriesWithPapers(branchId, semester) {
        const entries = subjectEntries(branchId, semester);
        const listed = new Set(entries.flatMap(([code]) => codeKeys(code)));
        const electives = new Map();

        state.papers
            .filter((paper) => paper.is_published !== false)
            .filter((paper) => Number(paper.semester) === Number(semester))
            .filter((paper) => branchMatchesPaper(branchId, paper))
            .forEach((paper) => {
                const key = normalizeCode(paper.subject_code);
                if (!listed.has(key) && !electives.has(key)) {
                    const category = key.startsWith("HMC") ? "HMC" : "DEC";
                    electives.set(key, [paper.subject_code, paper.subject_name, category]);
                }
            });

        return [...entries, ...electives.values()];
    }

    function totalSubjects(branch) {
        return Object.values(branch.semesters).reduce((total, semester) => total + semester.length, 0);
    }

    function branchMatchesPaper(branchId, paper) {
        // Papers shared by several programmes list them in "branches".
        if (Array.isArray(paper.branches)) {
            return paper.branches.includes(branchId);
        }
        const programme = String(paper.programme || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const expected = {
            cse: ["btechcse"],
            "cse-ai": ["btechcseai", "btechcseartificialintelligence"],
            it: ["btechit"],
            aiml: ["btechaiml", "btechartificialintelligencemachinelearning"],
            ece: ["btechece"],
            "ece-ai": ["btecheceai"],
            mae: ["btechmae"]
        };
        return (expected[branchId] || []).includes(programme);
    }

    function papersForSubject(branchId, semester, code) {
        const keys = codeKeys(code);
        return state.papers
            .filter((paper) => paper.is_published !== false)
            .filter((paper) => Number(paper.semester) === Number(semester))
            .filter((paper) => branchMatchesPaper(branchId, paper))
            .filter((paper) => keys.includes(normalizeCode(paper.subject_code)))
            .sort((a, b) => b.year - a.year || a.exam_type.localeCompare(b.exam_type));
    }

    function paperCountForBranch(branchId) {
        return state.papers.filter((paper) => paper.is_published !== false && branchMatchesPaper(branchId, paper)).length;
    }

    function setView(view) {
        state.view = view;
        viewIds.forEach((id) => {
            document.getElementById(id).hidden = id !== `${view}-view`;
        });
        renderHeader();
        renderBreadcrumb();
    }

    function renderHeader() {
        const branch = branches[state.branch];
        elements.source.href = branch ? branch.sourceUrl : curriculum.catalogueUrl;
        elements.source.innerHTML = branch
            ? `${escapeHTML(branch.sourceLabel)} <span>↗</span>`
            : "Official syllabus catalogue <span>↗</span>";

        if (state.view === "departments") {
            elements.title.textContent = "Choose your branch";
            elements.description.textContent = "Seven IGDTUW B.Tech programmes, mapped from official curriculum documents.";
        } else if (state.view === "years") {
            elements.title.textContent = branch.name;
            elements.description.textContent = "Choose your academic year to see its two semesters.";
        } else if (state.view === "semesters") {
            elements.title.textContent = `${ordinal(state.year)} year · ${branch.shortName}`;
            elements.description.textContent = "Choose the semester whose syllabus and papers you want to browse.";
        } else {
            elements.title.textContent = `${ordinal(state.semester)} semester · ${branch.shortName}`;
            elements.description.textContent = "Official curriculum subjects with live PYQ availability shown clearly.";
        }
    }

    function renderBreadcrumb() {
        const parts = [{ label: "All branches", view: "departments" }];
        if (state.branch) parts.push({ label: branches[state.branch].shortName, view: "years" });
        if (state.year) parts.push({ label: `${ordinal(state.year)} year`, view: "semesters" });
        if (state.semester) parts.push({ label: `${ordinal(state.semester)} semester`, view: "subjects" });

        elements.breadcrumb.innerHTML = parts.map((part, index) => {
            const current = index === parts.length - 1;
            const separator = index ? '<span aria-hidden="true">/</span>' : "";
            return `${separator}${current
                ? `<span aria-current="page">${escapeHTML(part.label)}</span>`
                : `<button type="button" data-breadcrumb-view="${part.view}">${escapeHTML(part.label)}</button>`}`;
        }).join("");
    }

    function renderDepartments() {
        elements.departmentGrid.innerHTML = Object.entries(branches).map(([branchId, branch]) => {
            const papers = paperCountForBranch(branchId);
            const subjectCount = totalSubjects(branch);
            return `
                <button class="department-card" type="button" data-branch="${escapeHTML(branchId)}" data-accent="${escapeHTML(branch.accent)}">
                    <span class="department-mark">${escapeHTML(branch.mark)}</span>
                    <h3>${escapeHTML(branch.name)}</h3>
                    <p>${escapeHTML(branch.summary)}</p>
                    <span class="department-meta"><span>8 semesters</span><span>${subjectCount} curriculum entries</span></span>
                    <span class="department-link">${papers ? `${papers} papers live` : "Syllabus mapped"}<span>→</span></span>
                </button>`;
        }).join("");
    }

    function renderYears() {
        const branch = branches[state.branch];
        elements.yearGrid.innerHTML = [1, 2, 3, 4].map((year) => {
            const firstSemester = year * 2 - 1;
            const secondSemester = year * 2;
            const count = subjectEntries(state.branch, firstSemester).length + subjectEntries(state.branch, secondSemester).length;
            const papers = state.papers.filter((paper) => branchMatchesPaper(state.branch, paper) && yearForSemester(paper.semester) === year).length;
            return `
                <button class="choice-card" type="button" data-year="${year}">
                    <span class="choice-number">YEAR 0${year}</span>
                    <h3>${ordinal(year)} year</h3>
                    <p>${year === 1 ? "Foundation" : year === 2 ? "Core engineering" : year === 3 ? "Advanced branch courses" : "Specialisation and projects"}</p>
                    <span class="choice-count">${count} curriculum entries · ${papers ? `${papers} papers live` : branch.shortName}</span>
                </button>`;
        }).join("");
    }

    function renderSemesters() {
        const semesterNumbers = [state.year * 2 - 1, state.year * 2];
        elements.semesterGrid.innerHTML = semesterNumbers.map((semester) => {
            const count = subjectEntries(state.branch, semester).length;
            const papers = state.papers.filter((paper) => branchMatchesPaper(state.branch, paper) && Number(paper.semester) === semester).length;
            return `
                <button class="choice-card" type="button" data-semester="${semester}">
                    <span class="choice-number">SEMESTER 0${semester}</span>
                    <h3>${ordinal(semester)} semester</h3>
                    <p>${semester % 2 ? "Odd semester curriculum" : "Even semester curriculum"}</p>
                    <span class="choice-count">${count} subjects · ${papers ? `${papers} verified PDFs` : "syllabus mapped"}</span>
                </button>`;
        }).join("");
    }

    function isCoreCategory(category) {
        return ["DCC", "BAS", "HMC"].includes(category);
    }

    function subjectMatchesFilter(entry) {
        const [code, , category] = entry;
        if (state.filter === "available") return papersForSubject(state.branch, state.semester, code).length > 0;
        if (state.filter === "core") return isCoreCategory(category);
        return true;
    }

    function renderPaperActions(papers) {
        if (!papers.length) {
            return `<div class="paper-empty"><span>PYQs coming soon</span><a href="${escapeHTML(branches[state.branch].sourceUrl)}" target="_blank" rel="noopener noreferrer">Syllabus ↗</a></div>`;
        }

        const groups = [
            ["Mid Semester", "Mid"],
            ["End Semester", "End"],
        ].map(([type, label]) => ({
            label,
            papers: papers.filter((paper) => paper.exam_type === type).slice(0, 3),
        })).filter((group) => group.papers.length);

        return `<div class="paper-actions">${groups.map((group) => `
            <div class="paper-action-group">
                <span class="paper-action-label">${group.label} papers</span>
                <div class="paper-action-years">${group.papers.map((paper) => {
                    const typeClass = group.label === "End" ? " end" : "";
                    return `<a class="paper-action${typeClass}" href="paper-viewer.html?id=${encodeURIComponent(paper.id)}"><span>▱</span>${escapeHTML(paper.year)}</a>`;
                }).join("")}</div>
            </div>
        `).join("")}</div>`;
    }

    function renderSubjects() {
        const entries = subjectEntriesWithPapers(state.branch, state.semester).filter(subjectMatchesFilter);
        elements.subjectResultCount.textContent = `${entries.length} ${entries.length === 1 ? "subject" : "subjects"}`;
        document.querySelectorAll(".filter-pill").forEach((button) => {
            button.classList.toggle("active", button.dataset.filter === state.filter);
        });

        if (!entries.length) {
            elements.subjectsContainer.innerHTML = `<div class="empty-state"><strong>No subjects match this filter.</strong><br>Try “All subjects” to see the complete semester curriculum.</div>`;
            return;
        }

        elements.subjectsContainer.innerHTML = entries.map(([code, name, category]) => {
            const papers = papersForSubject(state.branch, state.semester, code);
            return `
                <article class="subject-card" data-paper-count="${papers.length}" data-category="${escapeHTML(category)}">
                    <div class="subject-card-top"><span class="subject-code">${escapeHTML(code)}</span><span class="category-pill">${escapeHTML(category)}</span></div>
                    <h3>${escapeHTML(name)}</h3>
                    <p>${escapeHTML(categoryDescriptions[category] || categoryDescriptions.DCC)}</p>
                    ${renderPaperActions(papers)}
                </article>`;
        }).join("");
    }

    function showDepartments(options = {}) {
        state.branch = "";
        state.year = 0;
        state.semester = 0;
        state.filter = "all";
        renderDepartments();
        setView("departments");
        if (options.scroll) document.getElementById("explore").scrollIntoView({ behavior: "smooth" });
    }

    function showYears(branchId, options = {}) {
        if (!branches[branchId]) return;
        state.branch = branchId;
        state.year = 0;
        state.semester = 0;
        state.filter = "all";
        renderYears();
        setView("years");
        if (options.scroll) document.getElementById("explore").scrollIntoView({ behavior: "smooth" });
    }

    function showSemesters(year) {
        state.year = Number(year);
        state.semester = 0;
        state.filter = "all";
        renderSemesters();
        setView("semesters");
    }

    function showSubjects(semester) {
        state.semester = Number(semester);
        state.year = yearForSemester(state.semester);
        state.filter = "all";
        renderSubjects();
        setView("subjects");
    }

    function followBreadcrumb(view) {
        if (view === "departments") showDepartments();
        if (view === "years") showYears(state.branch);
        if (view === "semesters") showSemesters(state.year);
    }

    function allSearchEntries() {
        return Object.entries(branches).flatMap(([branchId, branch]) =>
            Object.keys(branch.semesters).flatMap((semester) =>
                subjectEntriesWithPapers(branchId, semester).map(([code, name, category]) => ({ branchId, branch, semester: Number(semester), code, name, category }))
            )
        );
    }

    function openSearch(query) {
        const cleanQuery = String(query || "").trim();
        if (!cleanQuery) {
            elements.searchInput.focus();
            return;
        }
        const needle = cleanQuery.toLowerCase();
        const results = allSearchEntries().filter((entry) =>
            entry.name.toLowerCase().includes(needle)
            || entry.code.toLowerCase().includes(needle)
            || entry.branch.name.toLowerCase().includes(needle)
            || entry.branch.shortName.toLowerCase().includes(needle)
        ).slice(0, 60);

        elements.searchTitle.textContent = `${results.length} result${results.length === 1 ? "" : "s"} for “${cleanQuery}”`;
        elements.searchResults.innerHTML = results.length ? results.map((entry) => `
            <button class="search-result" type="button" data-search-route="${escapeHTML(entry.branchId)},${entry.semester}">
                <div><h3>${escapeHTML(entry.name)}</h3><p>${escapeHTML(entry.branch.shortName)} · ${ordinal(entry.semester)} semester · ${escapeHTML(entry.category)}</p></div>
                <span>${escapeHTML(entry.code)} →</span>
            </button>`).join("") : `<div class="empty-state">No curriculum subject matched “${escapeHTML(cleanQuery)}”.</div>`;
        if (!elements.searchDialog.open) elements.searchDialog.showModal();
    }

    async function loadPapers() {
        try {
            const response = await fetch("data/papers.json", { cache: "no-store" });
            if (!response.ok) throw new Error(`Paper catalogue request failed with ${response.status}`);
            state.papers = await response.json();
        } catch (error) {
            console.warn("ExamForge paper catalogue is unavailable; curriculum browsing will still work.", error);
            state.papers = [];
        }

        document.getElementById("paper-count").textContent = state.papers.filter((paper) => paper.is_published !== false).length;
        document.getElementById("branch-count").textContent = Object.keys(branches).length;
        document.getElementById("semester-count").textContent = Object.keys(branches).length * 8;
        if (state.view === "departments") renderDepartments();
        if (state.view === "years") renderYears();
        if (state.view === "semesters") renderSemesters();
        if (state.view === "subjects") renderSubjects();
    }

    document.addEventListener("click", (event) => {
        const departmentCard = event.target.closest("[data-branch]");
        if (departmentCard) showYears(departmentCard.dataset.branch);

        const yearCard = event.target.closest("[data-year]");
        if (yearCard) showSemesters(yearCard.dataset.year);

        const semesterCard = event.target.closest("[data-semester]");
        if (semesterCard) showSubjects(semesterCard.dataset.semester);

        const breadcrumbButton = event.target.closest("[data-breadcrumb-view]");
        if (breadcrumbButton) followBreadcrumb(breadcrumbButton.dataset.breadcrumbView);

        const action = event.target.closest("[data-action]");
        if (action && action.dataset.action === "home") {
            showDepartments();
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
        if (action && action.dataset.action === "departments") showDepartments({ scroll: true });

        const quickRoute = event.target.closest("[data-quick-route]");
        if (quickRoute) {
            const [branchId, year, semester] = quickRoute.dataset.quickRoute.split(",");
            state.branch = branchId;
            state.year = Number(year);
            showSubjects(Number(semester));
            document.getElementById("explore").scrollIntoView({ behavior: "smooth" });
        }

        const filter = event.target.closest("[data-filter]");
        if (filter) {
            state.filter = filter.dataset.filter;
            renderSubjects();
        }

        const searchRoute = event.target.closest("[data-search-route]");
        if (searchRoute) {
            const [branchId, semester] = searchRoute.dataset.searchRoute.split(",");
            state.branch = branchId;
            showSubjects(Number(semester));
            elements.searchDialog.close();
            document.getElementById("explore").scrollIntoView({ behavior: "smooth" });
        }
    });

    elements.searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        openSearch(elements.searchInput.value);
    });

    document.getElementById("close-search").addEventListener("click", () => elements.searchDialog.close());
    elements.searchDialog.addEventListener("click", (event) => {
        if (event.target === elements.searchDialog) elements.searchDialog.close();
    });

    elements.menuToggle.addEventListener("click", () => {
        const expanded = elements.menuToggle.getAttribute("aria-expanded") === "true";
        elements.menuToggle.setAttribute("aria-expanded", String(!expanded));
        elements.mobileNav.hidden = expanded;
    });

    document.addEventListener("keydown", (event) => {
        const activeTag = document.activeElement && document.activeElement.tagName;
        if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(activeTag)) {
            event.preventDefault();
            elements.searchInput.focus();
        }
    });

    document.getElementById("current-year").textContent = new Date().getFullYear();
    renderDepartments();
    setView("departments");
    loadPapers();

    window.ExamForge = { showDepartments, showYears, showSemesters, showSubjects, openSearch };
})();
