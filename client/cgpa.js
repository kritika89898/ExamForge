(function () {
    // IGDTUW absolute grading scale (marks out of 100)
    const SCALE = [
        { min: 93, grade: "A+", points: 10 },
        { min: 85, grade: "A", points: 9 },
        { min: 77, grade: "B+", points: 8 },
        { min: 69, grade: "B", points: 7 },
        { min: 61, grade: "C+", points: 6 },
        { min: 53, grade: "C", points: 5 },
        { min: 45, grade: "D", points: 4 },
        { min: 0, grade: "F", points: 0 }
    ];
    const STORAGE_KEY = "examforge-cgpa-v1";

    const $ = (id) => document.getElementById(id);

    function gradeFor(marks) {
        return SCALE.find((s) => marks >= s.min);
    }

    function divisionFor(gpa) {
        if (gpa >= 8.5) return "First Division with Distinction";
        if (gpa >= 6) return "First Division";
        if (gpa >= 5) return "Second Division";
        return "Fail";
    }

    // Returns { value, ok }: value is null when empty or invalid.
    function readNumber(input, max) {
        const raw = input.value.trim();
        if (raw === "") { input.classList.remove("invalid"); return { value: null, ok: true, empty: true }; }
        const n = Number(raw);
        const ok = Number.isFinite(n) && n >= 0 && n <= max;
        input.classList.toggle("invalid", !ok);
        return { value: ok ? n : null, ok, empty: false };
    }

    function format(n) {
        return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
    }

    function numberInput(cls, label, max, step, value) {
        const input = document.createElement("input");
        input.type = "number";
        input.inputMode = "decimal";
        input.className = "calc-input num " + cls;
        input.min = "0";
        input.max = String(max);
        input.step = step;
        input.placeholder = "–";
        input.setAttribute("aria-label", label);
        if (value !== undefined && value !== null) input.value = value;
        return input;
    }

    function textInput(cls, label, value) {
        const input = document.createElement("input");
        input.type = "text";
        input.className = "calc-input " + cls;
        input.setAttribute("aria-label", label);
        input.maxLength = 60;
        if (value) input.value = value;
        return input;
    }

    function textSpan(cls) {
        return Object.assign(document.createElement("span"), { className: cls, textContent: "–" });
    }

    function removeButton(label) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "remove-btn";
        btn.textContent = "×";
        btn.setAttribute("aria-label", label);
        return btn;
    }

    function cell(child, cls, label) {
        const td = document.createElement("td");
        if (cls) td.className = cls;
        if (label) td.dataset.label = label;
        if (child) td.append(child);
        return td;
    }

    // ---------- Generic row table ----------
    function makeTable(config) {
        const tbody = $(config.tbodyId);
        const resultEl = $(config.prefix + "-result");
        const errorEl = $(config.prefix + "-error");

        function rowName(row, i) {
            return row.querySelector(".row-name").value.trim() || config.namePrefix + " " + (i + 1);
        }

        function clearOutput() {
            resultEl.hidden = true;
            errorEl.hidden = true;
        }

        function renumber() {
            [...tbody.rows].forEach((row, i) => {
                row.querySelector(".row-name").placeholder = config.namePrefix + " " + (i + 1);
                row.querySelector(".remove-btn").disabled = tbody.rows.length === 1;
            });
        }

        function addRow(data, focus) {
            const row = config.buildRow(data || {});
            row.querySelector(".remove-btn").addEventListener("click", () => {
                if (tbody.rows.length > 1) {
                    row.remove();
                    renumber();
                    changed();
                }
            });
            tbody.append(row);
            renumber();
            if (focus) row.querySelector(config.focusSelector).focus();
        }

        function changed() {
            [...tbody.rows].forEach(config.updateRow);
            clearOutput();
            save();
        }

        function calculate() {
            const rows = [...tbody.rows];
            let credits = 0;
            let points = 0;
            for (let i = 0; i < rows.length; i++) {
                const entry = config.readRow(rows[i]);
                if (entry.error) {
                    resultEl.hidden = true;
                    errorEl.textContent = rowName(rows[i], i) + ": " + entry.error;
                    errorEl.hidden = false;
                    return;
                }
                credits += entry.credits;
                points += entry.credits * entry.points;
            }
            errorEl.hidden = true;
            if (credits <= 0) {
                errorEl.textContent = "Enter at least one row with credits above 0.";
                errorEl.hidden = false;
                return;
            }
            const gpa = points / credits;
            resultEl.innerHTML = "";
            resultEl.append(
                document.createTextNode("Your " + config.label + " is "),
                Object.assign(document.createElement("strong"), { textContent: gpa.toFixed(2) }),
                Object.assign(document.createElement("span"), { textContent: divisionFor(gpa) })
            );
            resultEl.hidden = false;
        }

        tbody.addEventListener("input", changed);
        $(config.prefix + "-add").addEventListener("click", () => { addRow({}, true); changed(); });
        $(config.prefix + "-reset").addEventListener("click", () => {
            tbody.innerHTML = "";
            addRow({}, true);
            changed();
        });
        $(config.prefix + "-calc").addEventListener("click", calculate);

        return {
            load(rows) {
                tbody.innerHTML = "";
                (rows && rows.length ? rows : [{}]).forEach((r) => addRow(r, false));
                [...tbody.rows].forEach(config.updateRow);
            },
            serialize() {
                return [...tbody.rows].map(config.serializeRow);
            }
        };
    }

    // ---------- SGPA ----------
    const sgpa = makeTable({
        prefix: "sgpa",
        label: "SGPA",
        tbodyId: "sgpa-rows",
        namePrefix: "Subject",
        focusSelector: ".row-marks",
        buildRow(d) {
            const tr = document.createElement("tr");
            tr.append(
                cell(textInput("row-name", "Subject name (optional)", d.name), "name-cell"),
                cell(numberInput("row-marks", "Marks out of 100", 100, "any", d.marks), "", "Marks"),
                cell(numberInput("row-credits", "Credits", 10, "0.5", d.credits), "", "Credits"),
                cell(textSpan("grade-tag row-grade"), "", "Grade"),
                cell(textSpan("points-pill row-points"), "", "Points"),
                cell(removeButton("Remove subject"), "remove-cell")
            );
            return tr;
        },
        updateRow(tr) {
            const marks = readNumber(tr.querySelector(".row-marks"), 100).value;
            readNumber(tr.querySelector(".row-credits"), 10);
            const g = marks === null ? null : gradeFor(marks);
            tr.querySelector(".row-grade").textContent = g ? g.grade : "–";
            tr.querySelector(".row-points").textContent = g ? g.points : "–";
        },
        readRow(tr) {
            const m = readNumber(tr.querySelector(".row-marks"), 100);
            const c = readNumber(tr.querySelector(".row-credits"), 10);
            if (m.empty) return { error: "enter marks." };
            if (!m.ok) return { error: "marks must be between 0 and 100." };
            if (c.empty) return { error: "enter credits." };
            if (!c.ok) return { error: "credits must be between 0 and 10." };
            return { credits: c.value, points: gradeFor(m.value).points };
        },
        serializeRow(tr) {
            return {
                name: tr.querySelector(".row-name").value,
                marks: tr.querySelector(".row-marks").value,
                credits: tr.querySelector(".row-credits").value
            };
        }
    });

    // ---------- CGPA ----------
    const cgpa = makeTable({
        prefix: "cgpa",
        label: "CGPA",
        tbodyId: "cgpa-rows",
        namePrefix: "Semester",
        focusSelector: ".row-sgpa",
        buildRow(d) {
            const tr = document.createElement("tr");
            tr.append(
                cell(textInput("row-name", "Semester name (optional)", d.name), "name-cell"),
                cell(numberInput("row-sgpa", "SGPA", 10, "0.01", d.sgpa), "", "SGPA"),
                cell(numberInput("row-credits", "Credits", 60, "0.5", d.credits), "", "Credits"),
                cell(textSpan("grade-tag row-cp"), "", "Credit pts"),
                cell(removeButton("Remove semester"), "remove-cell")
            );
            return tr;
        },
        updateRow(tr) {
            const s = readNumber(tr.querySelector(".row-sgpa"), 10).value;
            const c = readNumber(tr.querySelector(".row-credits"), 60).value;
            tr.querySelector(".row-cp").textContent =
                s === null || c === null ? "–" : format(Math.round(s * c * 100) / 100);
        },
        readRow(tr) {
            const s = readNumber(tr.querySelector(".row-sgpa"), 10);
            const c = readNumber(tr.querySelector(".row-credits"), 60);
            if (s.empty) return { error: "enter SGPA." };
            if (!s.ok) return { error: "SGPA must be between 0 and 10." };
            if (c.empty) return { error: "enter credits." };
            if (!c.ok) return { error: "credits must be between 0 and 60." };
            return { credits: c.value, points: s.value };
        },
        serializeRow(tr) {
            return {
                name: tr.querySelector(".row-name").value,
                sgpa: tr.querySelector(".row-sgpa").value,
                credits: tr.querySelector(".row-credits").value
            };
        }
    });

    // ---------- Persistence (inputs only) ----------
    let ready = false;
    function save() {
        if (!ready) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ sgpa: sgpa.serialize(), cgpa: cgpa.serialize() }));
        } catch (e) { /* storage unavailable: calculator still works */ }
    }
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch (e) { saved = null; }
    sgpa.load(saved && saved.sgpa);
    cgpa.load(saved && saved.cgpa);
    ready = true;

    // ---------- Tabs ----------
    const tabs = document.querySelectorAll(".calc-tab");
    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            tabs.forEach((t) => {
                const active = t === tab;
                t.classList.toggle("active", active);
                t.setAttribute("aria-selected", String(active));
                $("panel-" + t.dataset.tab).hidden = !active;
            });
        });
    });

    $("current-year").textContent = new Date().getFullYear();
})();
