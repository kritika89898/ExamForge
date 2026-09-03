(function () {
    "use strict";

    const branches = window.EXAMFORGE_CURRICULUM?.branches || {};
    const maxFileBytes = 10 * 1024 * 1024;
    let selectedFile = null;
    let previewUrl = "";

    const elements = {
        form: document.getElementById("contribution-form"),
        branch: document.getElementById("branch"),
        semester: document.getElementById("semester"),
        subject: document.getElementById("subject"),
        examType: document.getElementById("exam-type"),
        year: document.getElementById("year"),
        month: document.getElementById("month"),
        contributorName: document.getElementById("contributor-name"),
        pdf: document.getElementById("pdf"),
        dropzone: document.getElementById("dropzone"),
        fileReview: document.getElementById("file-review"),
        fileName: document.getElementById("file-name"),
        fileDetails: document.getElementById("file-details"),
        preview: document.getElementById("pdf-preview"),
        removeFile: document.getElementById("remove-file"),
        fileError: document.getElementById("file-error"),
        authentic: document.getElementById("authentic"),
        publicConsent: document.getElementById("public-consent"),
        summarySubject: document.getElementById("summary-subject"),
        summaryProgramme: document.getElementById("summary-programme"),
        summaryExam: document.getElementById("summary-exam"),
        summaryFile: document.getElementById("summary-file"),
        submitButton: document.getElementById("submit-button"),
        submitLabel: document.getElementById("submit-label"),
        progress: document.getElementById("upload-progress"),
        progressBar: document.getElementById("progress-bar"),
        progressValue: document.getElementById("progress-value"),
        progressLabel: document.getElementById("progress-label"),
        status: document.getElementById("status"),
        successPanel: document.getElementById("success-panel"),
        reference: document.getElementById("reference-code"),
        submitAnother: document.getElementById("submit-another"),
    };

    function escapeHTML(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatBytes(bytes) {
        return `${(bytes / (1024 * 1024)).toFixed(bytes >= 1024 * 1024 ? 1 : 2)} MB`;
    }

    function setStatus(message, type = "") {
        elements.status.textContent = message;
        elements.status.className = `form-status${type ? ` ${type}` : ""}`;
    }

    function selectedSubject() {
        const branch = branches[elements.branch.value];
        const entries = branch?.semesters?.[elements.semester.value] || [];
        const entry = entries.find(([code]) => code === elements.subject.value);
        return entry ? { code: entry[0], name: entry[1], branch } : null;
    }

    function updateSummary() {
        const current = selectedSubject();
        elements.summarySubject.textContent = current ? `${current.code} - ${current.name}` : "Choose a subject";
        elements.summaryProgramme.textContent = current
            ? `${current.branch.shortName} · Semester ${elements.semester.value}`
            : "—";
        elements.summaryExam.textContent = `${elements.examType.value} · ${elements.month.value ? `${elements.month.value} ` : ""}${elements.year.value}`;
        elements.summaryFile.textContent = selectedFile ? selectedFile.name : "No PDF selected";
        updateSubmitState();
    }

    function updateSubmitState() {
        const ready = Boolean(
            selectedSubject()
            && elements.year.value
            && selectedFile
            && elements.authentic.checked
            && elements.publicConsent.checked
        );
        elements.submitButton.disabled = !ready;
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
        const semesters = Object.keys(branch?.semesters || {});
        const previous = elements.semester.value;
        elements.semester.innerHTML = semesters.map((semester) =>
            `<option value="${semester}">Semester ${semester}</option>`
        ).join("");
        elements.semester.value = semesters.includes(previous) ? previous : (semesters.includes("5") ? "5" : semesters[0]);
        populateSubjects();
    }

    function populateSubjects() {
        const branch = branches[elements.branch.value];
        const subjects = branch?.semesters?.[elements.semester.value] || [];
        const previous = elements.subject.value;
        elements.subject.innerHTML = subjects.map(([code, name]) =>
            `<option value="${escapeHTML(code)}">${escapeHTML(code)} - ${escapeHTML(name)}</option>`
        ).join("");
        const codes = subjects.map(([code]) => code);
        elements.subject.value = codes.includes(previous) ? previous : (codes.includes("BAI 301") ? "BAI 301" : codes[0]);
        updateSummary();
    }

    function populateYears() {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let year = currentYear; year >= 2015; year -= 1) years.push(year);
        elements.year.innerHTML = years.map((year) => `<option value="${year}">${year}</option>`).join("");
        elements.year.value = String(Math.min(2025, currentYear));
    }

    async function hasPdfMarkers(file) {
        const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
        const headerText = String.fromCharCode(...header);
        const tail = new Uint8Array(await file.slice(Math.max(0, file.size - 1024)).arrayBuffer());
        const tailText = new TextDecoder("latin1").decode(tail);
        return headerText === "%PDF-" && tailText.includes("%%EOF");
    }

    function clearFile() {
        selectedFile = null;
        elements.pdf.value = "";
        elements.fileReview.hidden = true;
        elements.fileName.textContent = "";
        elements.fileDetails.textContent = "";
        elements.summaryFile.textContent = "No PDF selected";
        elements.fileError.textContent = "";
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = "";
        elements.preview.removeAttribute("src");
        updateSubmitState();
    }

    async function chooseFile(file) {
        clearFile();
        if (!file) return;
        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
            elements.fileError.textContent = "Choose a PDF file.";
            return;
        }
        if (file.size > maxFileBytes) {
            elements.fileError.textContent = "PDF must be 10 MB or smaller.";
            return;
        }
        if (!(await hasPdfMarkers(file))) {
            elements.fileError.textContent = "This file does not appear to be a valid PDF.";
            return;
        }

        selectedFile = file;
        previewUrl = URL.createObjectURL(file);
        elements.fileName.textContent = file.name;
        elements.fileDetails.textContent = `${formatBytes(file.size)} · ready to preview`;
        elements.preview.src = previewUrl;
        elements.fileReview.hidden = false;
        elements.fileError.textContent = "";
        updateSummary();
    }

    function buildFormData() {
        const data = new FormData();
        data.append("branch", elements.branch.value);
        data.append("semester", elements.semester.value);
        data.append("subjectCode", elements.subject.value);
        data.append("examType", elements.examType.value);
        data.append("year", elements.year.value);
        data.append("month", elements.month.value);
        data.append("contributorName", elements.contributorName.value.trim());
        data.append("authentic", String(elements.authentic.checked));
        data.append("publicConsent", String(elements.publicConsent.checked));
        data.append("pdf", selectedFile);
        return data;
    }

    function submitContribution(event) {
        event.preventDefault();
        if (elements.submitButton.disabled || !selectedFile) {
            setStatus("Complete the details, select a PDF and confirm both statements.", "error");
            return;
        }

        const request = new XMLHttpRequest();
        request.open("POST", "/api/pdf/upload");
        elements.submitButton.disabled = true;
        elements.submitLabel.textContent = "Submitting...";
        elements.progress.hidden = false;
        elements.progressBar.value = 0;
        elements.progressValue.textContent = "0%";
        elements.progressLabel.textContent = "Uploading securely...";
        setStatus("");

        request.upload.addEventListener("progress", (progress) => {
            if (!progress.lengthComputable) return;
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            elements.progressBar.value = percentage;
            elements.progressValue.textContent = `${percentage}%`;
        });

        request.addEventListener("load", () => {
            let response;
            try {
                response = JSON.parse(request.responseText);
            } catch {
                response = { success: false, message: "The server returned an unreadable response." };
            }

            if (request.status < 200 || request.status >= 300 || !response.success) {
                setStatus(response.message || "Unable to submit this paper.", "error");
                elements.progress.hidden = true;
                elements.submitLabel.textContent = "Submit paper for review";
                updateSubmitState();
                return;
            }

            elements.progressBar.value = 100;
            elements.progressValue.textContent = "100%";
            elements.progressLabel.textContent = "Submission received";
            elements.reference.textContent = response.data.reference;
            elements.form.hidden = true;
            elements.successPanel.hidden = false;
            elements.successPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        });

        request.addEventListener("error", () => {
            setStatus("Unable to connect to the contribution service.", "error");
            elements.progress.hidden = true;
            elements.submitLabel.textContent = "Submit paper for review";
            updateSubmitState();
        });

        request.send(buildFormData());
    }

    elements.branch.addEventListener("change", populateSemesters);
    elements.semester.addEventListener("change", populateSubjects);
    [elements.subject, elements.examType, elements.year, elements.month].forEach((element) =>
        element.addEventListener("change", updateSummary)
    );
    [elements.authentic, elements.publicConsent].forEach((element) =>
        element.addEventListener("change", updateSubmitState)
    );
    elements.pdf.addEventListener("change", () => chooseFile(elements.pdf.files[0]));
    elements.removeFile.addEventListener("click", clearFile);
    ["dragenter", "dragover"].forEach((name) => elements.dropzone.addEventListener(name, (event) => {
        event.preventDefault();
        elements.dropzone.classList.add("dragging");
    }));
    ["dragleave", "drop"].forEach((name) => elements.dropzone.addEventListener(name, (event) => {
        event.preventDefault();
        elements.dropzone.classList.remove("dragging");
    }));
    elements.dropzone.addEventListener("drop", (event) => chooseFile(event.dataTransfer.files[0]));
    elements.form.addEventListener("submit", submitContribution);
    elements.submitAnother.addEventListener("click", () => {
        elements.form.reset();
        clearFile();
        populateBranches();
        populateYears();
        elements.progress.hidden = true;
        elements.submitLabel.textContent = "Submit paper for review";
        elements.successPanel.hidden = true;
        elements.form.hidden = false;
        setStatus("");
        elements.form.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    window.addEventListener("beforeunload", () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
    });

    document.getElementById("current-year").textContent = new Date().getFullYear();
    populateYears();
    populateBranches();
    updateSummary();
}());
