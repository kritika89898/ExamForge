console.log("upload.js loaded");

const form = document.getElementById("uploadForm");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    console.log("Submit intercepted");

    const department = document.getElementById("department").value;
    const semester = document.getElementById("semester").value;
    const subject = document.getElementById("subject").value;
    const pdf = document.getElementById("pdf").files[0];

    console.log({
        department,
        semester,
        subject,
        pdf
    });

    const formData = new FormData();

    formData.append("department", department);
    formData.append("semester", semester);
    formData.append("subject", subject);
    formData.append("pdf", pdf);

    try {

        console.log("Sending request...");

        const response = await fetch(
            "http://localhost:5000/api/pdf/upload",
            {
                method: "POST",
                body: formData
            }
        );

        console.log("Response status:", response.status);

        const data = await response.json();

        console.log("Response data:", data);

        document.getElementById("status").innerHTML =
            `<h3>${data.message || "Upload Successful ✅"}</h3>`;

        console.log("Status updated");

    } catch (err) {

        console.error(err);

        document.getElementById("status").innerHTML =
            "<h3>Upload Failed ❌</h3>";

    }

});