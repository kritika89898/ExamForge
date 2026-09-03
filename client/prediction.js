(function () {
    "use strict";

    const curriculum = window.EXAMFORGE_CURRICULUM;
    const branches = curriculum?.branches || {};
    const maxPapers = 3;
    const maxFileBytes = 10 * 1024 * 1024;
    const state = {
        catalog: [],
        selectedIds: new Set(),
        uploads: [],
    };

    const elements = {
        form: document.getElementById("analysis-form"),
        branch: document.getElementById("branch-select"),
        semester: document.getElementById("semester-select"),
        subject: document.getElementById("subject-select"),
        examType: document.getElementById("exam-type-select"),
        archiveList: document.getElementById("archive-paper-list"),
        archiveHelp: document.getElementById("archive-help"),
        counter: document.getElementById("selection-counter"),
        coverage: document.getElementById("year-coverage"),
        pdfInput: document.getElementById("pdf-input"),
        dropzone: document.getElementById("pdf-dropzone"),
        dropzoneTitle: document.getElementById("dropzone-title"),
        uploadHelp: document.getElementById("upload-help"),
        uploadList: document.getElementById("upload-list"),
        summary: document.getElementById("analysis-summary"),
        status: document.getElementById("form-status"),
        button: document.getElementById("analyse-button"),
        buttonLabel: document.getElementById("analyse-button-label"),
        results: document.getElementById("results-section"),
        resultsTitle: document.getElementById("results-title"),
        sourceCount: document.getElementById("result-source-count"),
        topics: document.getElementById("topic-results"),
        questions: document.getElementById("question-results"),
    };

    function escapeHTML(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function selectedSubject() {
        const branch = branches[elements.branch.value];
        const entries = branch?.semesters?.[elements.semester.value] || [];
        const entry = entries.find(([code]) => code === elements.subject.value);
        return entry ? { code: entry[0], name: entry[1], branch } : null;
    }

    function totalSelected() {
        return state.selectedIds.size + state.uploads.length;
    }

    function selectedArchivePapers() {
        return state.catalog.filter((paper) => state.selectedIds.has(paper.id));
    }

    function selectionYears() {
        return [
            ...selectedArchivePapers().map((paper) => Number(paper.year)),
            ...state.uploads.map((upload) => Number(upload.year)),
        ];
    }

    function hasUniqueYears() {
        const years = selectionYears();
        return new Set(years).size === years.length;
    }

    function comparisonReady() {
        return totalSelected() === maxPapers && hasUniqueYears();
    }

    function setStatus(message, type = "") {
        elements.status.textContent = message;
        elements.status.className = `form-status${type ? ` ${type}` : ""}`;
    }

    function paperProgrammeMatches(paper, branch) {
        const programme = String(paper.programme || "").replace(/^B\.Tech\s*/i, "").trim();
        return programme === branch.shortName;
    }

    function subjectPapers() {
        const current = selectedSubject();
        if (!current) return [];

        return state.catalog
            .filter((paper) => paper.is_published !== false)
            .filter((paper) => paperProgrammeMatches(paper, current.branch))
            .filter((paper) => Number(paper.semester) === Number(elements.semester.value))
            .filter((paper) => paper.subject_code === current.code)
            .filter((paper) => paper.exam_type === elements.examType.value)
            .sort((a, b) => Number(b.year) - Number(a.year));
    }

    function targetYears() {
        const matchingYears = subjectPapers().map((paper) => Number(paper.year));
        const catalogYears = state.catalog.map((paper) => Number(paper.year)).filter(Number.isFinite);
        const latestYear = Math.max(...matchingYears, ...catalogYears, 2025);
        return [latestYear, latestYear - 1, latestYear - 2];
    }

    function renderYearCoverage() {
        const archiveYears = new Set(subjectPapers().map((paper) => Number(paper.year)));
        const uploadedYears = new Set(state.uploads.map((upload) => Number(upload.year)));

        elements.coverage.innerHTML = targetYears().map((year) => {
            let status = "missing";
            let label = "Upload needed";
            if (archiveYears.has(year)) {
                status = "available";
                label = "On site";
            }
            if (uploadedYears.has(year)) {
                status = "added";
                label = "Upload added";
            }
            return `<span class="year-chip ${status}">${year}<small>${label}</small></span>`;
        }).join("");
    }

    function refreshSelectionSummary() {
        const total = totalSelected();
        const remaining = maxPapers - total;
        elements.counter.textContent = `${total} of ${maxPapers} years selected`;

        if (!hasUniqueYears()) {
            elements.summary.textContent = "Each selected paper must be from a different year.";
        } else if (comparisonReady()) {
            elements.summary.textContent = `${elements.examType.value}: ${selectionYears().sort((a, b) => a - b).join(", ")} ready for analysis.`;
        } else {
            elements.summary.textContent = `Add ${remaining} more ${elements.examType.value} paper${remaining === 1 ? "" : "s"} from different years.`;
        }

        elements.button.disabled = !comparisonReady();
        renderYearCoverage();
    }

    function renderArchivePapers() {
        const papers = subjectPapers();
        const availableIds = new Set(papers.map((paper) => paper.id));
        [...state.selectedIds].forEach((id) => {
            if (!availableIds.has(id)) state.selectedIds.delete(id);
        });

        if (!papers.length) {
            elements.archiveList.innerHTML = `
                <div class="papers-empty">
                    <strong>No ${escapeHTML(elements.examType.value)} papers for this subject yet</strong>
                    Upload three papers from different years below.
                </div>`;
            refreshSelectionSummary();
            return;
        }

        elements.archiveList.innerHTML = papers.map((paper) => {
            const selected = state.selectedIds.has(paper.id);
            return `
                <label class="archive-paper${selected ? " selected" : ""}" data-paper-id="${escapeHTML(paper.id)}">
                    <input type="checkbox" ${selected ? "checked" : ""}>
                    <span class="paper-check">✓</span>
                    <span><strong>${escapeHTML(paper.exam_type)} ${escapeHTML(paper.year)}</strong><small>${escapeHTML(paper.exam_month)} · ${paper.page_count} page${paper.page_count === 1 ? "" : "s"}</small></span>
                    <span class="paper-year">${escapeHTML(paper.year)}</span>
                </label>`;
        }).join("");

        refreshSelectionSummary();
    }

    function populateBranches() {
        elements.branch.innerHTML = Object.entries(branches).map(([id, branch]) =>
            `<option value="${escapeHTML(id)}">${escapeHTML(branch.shortName)} - ${escapeHTML(branch.name)}</option>`
        ).join("");
        elements.branch.value = branches["cse-ai"] ? "cse-ai" : Object.keys(branches)[0];
        populateSemesters();
    }

    function populateSemesters() {
        const branch = branches[elements.branch.value];
        const semesterNumbers = Object.keys(branch?.semesters || {});
        const previous = elements.semester.value;

        elements.semester.innerHTML = semesterNumbers.map((semester) =>
            `<option value="${semester}">Semester ${semester}</option>`
        ).join("");
        elements.semester.value = semesterNumbers.includes(previous)
            ? previous
            : (semesterNumbers.includes("5") ? "5" : semesterNumbers[0]);
        populateSubjects();
    }

    function populateSubjects() {
        const branch = branches[elements.branch.value];
        const entries = branch?.semesters?.[elements.semester.value] || [];
        const previous = elements.subject.value;

        elements.subject.innerHTML = entries.map(([code, name]) =>
            `<option value="${escapeHTML(code)}">${escapeHTML(code)} - ${escapeHTML(name)}</option>`
        ).join("");

        const codes = entries.map(([code]) => code);
        elements.subject.value = codes.includes(previous)
            ? previous
            : (codes.includes("BAI 301") ? "BAI 301" : codes[0]);

        state.selectedIds.clear();
        state.uploads = [];
        renderUploads();
        renderArchivePapers();
    }

    function formatFileSize(bytes) {
        return `${(bytes / (1024 * 1024)).toFixed(bytes >= 1024 * 1024 ? 1 : 2)} MB`;
    }

    function renderUploads() {
        const years = targetYears();
        elements.uploadList.innerHTML = state.uploads.map((upload, index) => `
            <div class="upload-item">
                <span>PDF</span>
                <span><strong>${escapeHTML(upload.file.name)}</strong><small>${formatFileSize(upload.file.size)} · ${escapeHTML(elements.examType.value)}</small></span>
                <select class="upload-year" data-upload-year="${index}" aria-label="Year for ${escapeHTML(upload.file.name)}">
                    ${years.map((year) => `<option value="${year}"${Number(upload.year) === year ? " selected" : ""}>${year}</option>`).join("")}
                </select>
                <button class="remove-upload" type="button" data-upload-index="${index}" aria-label="Remove ${escapeHTML(upload.file.name)}">×</button>
            </div>`).join("");
        refreshSelectionSummary();
    }

    function addUploads(fileList) {
        const incoming = [...fileList];
        let message = "";

        incoming.forEach((file) => {
            if (totalSelected() >= maxPapers) {
                message = `You can analyse no more than ${maxPapers} papers at once.`;
                return;
            }
            if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
                message = `${file.name} is not a PDF.`;
                return;
            }
            if (file.size > maxFileBytes) {
                message = `${file.name} is larger than 10 MB.`;
                return;
            }
            const duplicate = state.uploads.some((saved) =>
                saved.file.name === file.name
                && saved.file.size === file.size
                && saved.file.lastModified === file.lastModified
            );
            if (!duplicate) {
                const usedYears = new Set(selectionYears());
                const year = targetYears().find((candidate) => !usedYears.has(candidate)) || targetYears()[0];
                state.uploads.push({ file, year });
            }
        });

        elements.pdfInput.value = "";
        renderUploads();
        setStatus(message, message ? "error" : "");
    }

    function renderResults(data) {
        const current = selectedSubject();
        elements.resultsTitle.textContent = `${current?.name || "Subject"} ${elements.examType.value} insights`;
        elements.sourceCount.textContent = `${data.sourceCount} paper${data.sourceCount === 1 ? "" : "s"} analysed`;
        elements.topics.innerHTML = data.importantTopics.map((topic) => `<li>${escapeHTML(topic)}</li>`).join("");
        elements.questions.innerHTML = data.likelyQuestions.map((question) => `<li>${escapeHTML(question)}</li>`).join("");
        elements.results.hidden = false;
        elements.results.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function submitAnalysis(event) {
        event.preventDefault();
        const current = selectedSubject();

        if (!current || !comparisonReady()) {
            setStatus("Choose exactly three papers of the selected exam type from different years.", "error");
            return;
        }

        const formData = new FormData();
        formData.append("subject", `${current.code} ${current.name}`);
        formData.append("subjectCode", current.code);
        formData.append("examType", elements.examType.value);
        formData.append("paperIds", JSON.stringify([...state.selectedIds]));
        formData.append("uploadYears", JSON.stringify(state.uploads.map((upload) => Number(upload.year))));
        state.uploads.forEach((upload) => formData.append("pdfs", upload.file));

        elements.button.disabled = true;
        elements.buttonLabel.textContent = "Analysing selected papers...";
        elements.results.hidden = true;
        setStatus(`Comparing three years of ${elements.examType.value} papers...`);

        try {
            const response = await fetch("/api/predict", { method: "POST", body: formData });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to analyse these papers.");
            }

            renderResults(data.data);
            setStatus("Analysis completed.", "success");
        } catch (error) {
            setStatus(error.message || "Unable to connect to ExamForge AI.", "error");
        } finally {
            elements.button.disabled = !comparisonReady();
            elements.buttonLabel.textContent = "Find topics & likely questions";
        }
    }

    elements.branch.addEventListener("change", () => {
        state.selectedIds.clear();
        populateSemesters();
    });
    elements.semester.addEventListener("change", () => {
        state.selectedIds.clear();
        populateSubjects();
    });
    elements.subject.addEventListener("change", () => {
        state.selectedIds.clear();
        state.uploads = [];
        renderUploads();
        renderArchivePapers();
    });
    elements.examType.addEventListener("change", () => {
        state.selectedIds.clear();
        state.uploads = [];
        elements.archiveHelp.textContent = `Only ${elements.examType.value} papers are shown. Mid and End papers are never mixed.`;
        elements.uploadHelp.textContent = `Upload only ${elements.examType.value} papers for years missing from the archive.`;
        elements.dropzoneTitle.textContent = `Drop ${elements.examType.value} PDFs here or choose files`;
        renderUploads();
        renderArchivePapers();
    });
    elements.archiveList.addEventListener("change", (event) => {
        const card = event.target.closest("[data-paper-id]");
        if (!card) return;

        const id = card.dataset.paperId;
        if (event.target.checked) {
            if (totalSelected() >= maxPapers) {
                event.target.checked = false;
                setStatus(`You can analyse no more than ${maxPapers} papers at once.`, "error");
                return;
            }
            const paper = state.catalog.find((entry) => entry.id === id);
            if (selectionYears().includes(Number(paper?.year))) {
                event.target.checked = false;
                setStatus(`A ${paper.year} paper is already selected. Choose a different year.`, "error");
                return;
            }
            state.selectedIds.add(id);
        } else {
            state.selectedIds.delete(id);
        }

        card.classList.toggle("selected", state.selectedIds.has(id));
        setStatus("");
        refreshSelectionSummary();
    });
    elements.pdfInput.addEventListener("change", () => addUploads(elements.pdfInput.files));
    elements.uploadList.addEventListener("click", (event) => {
        const button = event.target.closest("[data-upload-index]");
        if (!button) return;
        state.uploads.splice(Number(button.dataset.uploadIndex), 1);
        renderUploads();
        setStatus("");
    });
    elements.uploadList.addEventListener("change", (event) => {
        const select = event.target.closest("[data-upload-year]");
        if (!select) return;
        state.uploads[Number(select.dataset.uploadYear)].year = Number(select.value);
        refreshSelectionSummary();
        setStatus(hasUniqueYears() ? "" : "Each paper must use a different year.", hasUniqueYears() ? "" : "error");
    });
    ["dragenter", "dragover"].forEach((name) => elements.dropzone.addEventListener(name, (event) => {
        event.preventDefault();
        elements.dropzone.classList.add("dragging");
    }));
    ["dragleave", "drop"].forEach((name) => elements.dropzone.addEventListener(name, (event) => {
        event.preventDefault();
        elements.dropzone.classList.remove("dragging");
    }));
    elements.dropzone.addEventListener("drop", (event) => addUploads(event.dataTransfer.files));
    elements.form.addEventListener("submit", submitAnalysis);

    async function initialize() {
        document.getElementById("current-year").textContent = new Date().getFullYear();
        populateBranches();

        try {
            const response = await fetch("data/papers.json", { cache: "no-store" });
            if (!response.ok) throw new Error("Paper catalogue could not be loaded.");
            state.catalog = await response.json();
            renderArchivePapers();
        } catch (error) {
            setStatus("Archive papers could not be loaded. You can still upload your own PDFs.", "error");
        }
    }

    initialize();
}());
