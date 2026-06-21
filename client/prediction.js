const subjectSelect = document.getElementById("subject");
const predictBtn = document.getElementById("predictBtn");
const questionsList = document.getElementById("questions");
const topicsList = document.getElementById("topics");
const strategy = document.getElementById("strategy");

async function loadSubjects() {

    try {

        const res = await fetch("http://localhost:5000/api/subjects");

        const data = await res.json();

        if (!data.success) {

            alert("Failed to load subjects");

            return;

        }

        subjectSelect.innerHTML = "";

        data.subjects.forEach(subject => {

            subjectSelect.innerHTML += `
                <option value="${subject}">
                    ${subject}
                </option>
            `;

        });

    } catch (err) {

        console.error(err);

        alert("Unable to connect to server.");

    }

}

loadSubjects();

predictBtn.addEventListener("click", async () => {

    const subject = subjectSelect.value;

    questionsList.innerHTML =
        "<li>Generating AI prediction...</li>";

    topicsList.innerHTML = "";

    strategy.innerHTML = "";

    try {

        const res = await fetch(

            `http://localhost:5000/api/predict/${subject}`

        );

        const data = await res.json();

        if (!data.success) {

            questionsList.innerHTML =
                "<li>Prediction Failed.</li>";

            return;

        }

        const result = data.data;

        questionsList.innerHTML = "";

        result.predictedQuestions.forEach(question => {

            questionsList.innerHTML += `
                <li>${question}</li>
            `;

        });

        topicsList.innerHTML = "";

        result.importantTopics.forEach(topic => {

            topicsList.innerHTML += `
                <li>${topic}</li>
            `;

        });

        strategy.innerHTML = result.studyStrategy;

    } catch (err) {

        console.error(err);

        questionsList.innerHTML =
            "<li>Server Error.</li>";

    }

});