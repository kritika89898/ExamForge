(function () {
    "use strict";

    const elements = {
        title: document.getElementById("paper-title"),
        context: document.getElementById("paper-context"),
        college: document.getElementById("detail-college"),
        programme: document.getElementById("detail-programme"),
        semester: document.getElementById("detail-semester"),
        exam: document.getElementById("detail-exam"),
        sourceBadge: document.getElementById("source-badge"),
        openLink: document.getElementById("open-link"),
        downloadLink: document.getElementById("download-link"),
        loading: document.getElementById("loading-state"),
        loadingMessage: document.getElementById("loading-message"),
        error: document.getElementById("error-state"),
        errorMessage: document.getElementById("error-message"),
        pages: document.getElementById("pdf-pages"),
    };

    function getPaperId() {
        return new URLSearchParams(window.location.search).get("id");
    }

    // PDFs live in the examforge-papers repo and are served by GitHub Pages,
    // which keeps the Vercel deployment small. Must match PAPERS_BASE_URL in
    // client/api/predict.js.
    const PAPERS_BASE_URL = "https://kritika89898.github.io/examforge-papers/";

    function resolvePdfUrl(paper) {
        const filePath = String(paper.file_path || "")
            .split("/")
            .filter((segment) => segment && segment !== "..")
            .map((segment) => encodeURIComponent(segment))
            .join("/");

        if (!filePath) {
            throw new Error("This paper's PDF is not available yet.");
        }

        return {
            url: PAPERS_BASE_URL + filePath,
            source: "ExamForge archive",
        };
    }

    function populateMetadata(paper, source) {
        document.title = `${paper.subject_name} ${paper.year} - ExamForge`;
        elements.title.textContent = `${paper.subject_name} - ${paper.exam_type} ${paper.year}`;
        elements.context.textContent = `${paper.subject_code} / ${paper.exam_month} ${paper.year}`;
        elements.college.textContent = paper.college;
        elements.programme.textContent = paper.programme;
        elements.semester.textContent = `Semester ${paper.semester}`;
        elements.exam.textContent = `${paper.exam_type}, ${paper.year}`;
        elements.sourceBadge.textContent = source;
    }

    function configureLinks(url, paper) {
        const downloadName = `${paper.subject_code}_${paper.exam_type}_${paper.year}`
            .replace(/[^a-z0-9]+/gi, "_")
            .replace(/^_|_$/g, "");

        elements.openLink.href = url;
        elements.downloadLink.href = url;
        elements.downloadLink.setAttribute("download", `${downloadName}.pdf`);
    }

    function showError(message) {
        elements.loading.classList.add("hidden");
        elements.pages.classList.add("hidden");
        elements.error.classList.remove("hidden");
        elements.errorMessage.textContent = message;
    }

    function showNativeViewer(url, paper) {
        elements.loading.classList.add("hidden");
        elements.pages.replaceChildren();
        const iframe = document.createElement("iframe");
        iframe.className = "native-viewer";
        iframe.title = `${paper.subject_name} question paper`;
        iframe.src = url;
        elements.pages.appendChild(iframe);
    }

    async function renderWithPdfJs(url) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        elements.loadingMessage.textContent = "Loading the selected paper...";
        const pdf = await window.pdfjsLib.getDocument(url).promise;
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            elements.loadingMessage.textContent = `Rendering page ${pageNumber} of ${pdf.numPages}...`;
            const page = await pdf.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 1.55 * pixelRatio });
            const wrapper = document.createElement("article");
            const canvas = document.createElement("canvas");
            const label = document.createElement("p");
            const context = canvas.getContext("2d", { alpha: false });

            wrapper.className = "pdf-page";
            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            label.className = "page-label";
            label.textContent = `Page ${pageNumber} of ${pdf.numPages}`;
            wrapper.append(canvas, label);
            elements.pages.appendChild(wrapper);

            await page.render({ canvasContext: context, viewport }).promise;
        }

        elements.loading.classList.add("hidden");
    }

    async function initializeViewer() {
        const paperId = getPaperId();
        if (!paperId) {
            showError("The paper link is missing its document ID.");
            return;
        }

        try {
            const response = await fetch("data/papers.json", { cache: "no-store" });
            if (!response.ok) throw new Error("Paper catalog could not be loaded.");

            const papers = await response.json();
            const paper = papers.find((entry) => entry.id === paperId && entry.is_published);
            if (!paper) throw new Error("This paper is not available in the published catalog.");

            const resolved = resolvePdfUrl(paper);
            populateMetadata(paper, resolved.source);
            configureLinks(resolved.url, paper);

            if (!window.pdfjsLib) {
                showNativeViewer(resolved.url, paper);
                return;
            }

            try {
                await renderWithPdfJs(resolved.url);
            } catch (renderError) {
                // The file is fine but PDF.js could not draw it: use the browser's own viewer.
                console.warn("PDF.js rendering failed, using the browser viewer", renderError);
                showNativeViewer(resolved.url, paper);
            }
        } catch (error) {
            showError(error.message || "The paper could not be loaded.");
        }
    }

    initializeViewer();
}());
