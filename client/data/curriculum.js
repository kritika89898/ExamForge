(function () {
    const subject = (code, name, category = "DCC") => [code, name, category];

    const commonEngineeringYear = {
        1: [
            subject("BAS 101", "Applied Mathematics I", "BAS"),
            subject("BAS 103", "Applied Physics I", "BAS"),
            subject("BAS 105", "Applied Chemistry", "BAS"),
            subject("BMA 110 / BEC 110", "Engineering Mechanics / Basic Electrical Engineering", "OEC"),
            subject("BMA 120 / BMA 130", "Workshop Practice / Engineering Graphics", "OEC"),
            subject("HMC 110 / BCS 110", "Humanities and Social Science / Programming in C", "HMC")
        ],
        2: [
            subject("BAS 102", "Applied Mathematics II", "BAS"),
            subject("BAS 104", "Applied Physics II", "BAS"),
            subject("BAS 106", "Environmental Science", "BAS"),
            subject("BEC 110 / BMA 110", "Basic Electrical Engineering / Engineering Mechanics", "OEC"),
            subject("BMA 130 / BMA 120", "Engineering Graphics / Workshop Practice", "OEC"),
            subject("BCS 110 / HMC 110", "Programming in C / Humanities and Social Science", "HMC")
        ]
    };

    const aiFoundationYear = {
        1: [
            subject("BAI 101", "Intelligent Systems"),
            subject("BAI 103", "Computer Organization and Architecture"),
            subject("BAI 110", "Programming with Python"),
            subject("BAS 107", "Applied Physics", "BAS"),
            subject("BAS 109", "Applied Mathematics", "BAS"),
            subject("HMC 110", "Communication Skills", "HMC")
        ],
        2: [
            subject("BAI 102", "Object Oriented Programming using Java"),
            subject("BAI 104", "Introduction to Data Science"),
            subject("BAI 108", "IT Workshop"),
            subject("BAS 106", "Environmental Science", "BAS"),
            subject("BAS 108", "Probability and Statistics", "BAS")
        ]
    };

    const branches = {
        cse: {
            shortName: "CSE",
            name: "Computer Science & Engineering",
            mark: "</>",
            accent: "blue",
            summary: "Algorithms, systems, software engineering and intelligent computing.",
            sourceLabel: "Official IGDTUW CSE curriculum",
            sourceUrl: "https://www.igdtuw.ac.in/IGDTUW/uploads/1849469792.pdf",
            semesters: {
                ...commonEngineeringYear,
                3: [subject("BCS 201", "Data Structures"), subject("BCS 203", "Discrete Structures"), subject("BIT 201", "Database Management Systems"), subject("BIT 203", "Software Engineering"), subject("OEC 201", "Open Elective I", "OEC"), subject("BCS 253", "Industrial Training / Internship", "Project")],
                4: [subject("BCS 202", "Computer Organization and Architecture"), subject("BCS 204", "Design and Analysis of Algorithms"), subject("BIT 202", "Operating Systems"), subject("BIT 204", "Object Oriented Programming"), subject("OEC 202", "Open Elective II", "OEC"), subject("HMC 202", "Disaster Management", "HMC")],
                5: [subject("BIT 301", "Data Communication and Computer Networks"), subject("BCS 301", "Artificial Intelligence"), subject("BAS 301", "Modelling and Simulation", "BAS"), subject("BCS 303", "Theory of Computation"), subject("HMC 301", "Professional Ethics and Human Values", "HMC"), subject("BCS 353", "Industrial Training / Internship", "Project"), subject("GEC 301", "Generic Open Elective II", "GEC")],
                6: [subject("BCS 302", "Wireless Networks"), subject("BCS 304", "Microprocessor and Interfacing"), subject("BCS 306", "Compiler Design"), subject("DEC 3XX-I", "Departmental Elective I", "DEC"), subject("DEC 3XX-II", "Departmental Elective II", "DEC"), subject("HMC 30X", "Management Elective", "HMC")],
                7: [subject("BIT 401", "Mobile Computing"), subject("BCS 401", "Machine Learning"), subject("DEC 4XX-III", "Departmental Elective III", "DEC"), subject("DEC 4XX-IV", "Departmental Elective IV", "DEC"), subject("BCS 451", "Minor Project", "Project"), subject("BCS 453", "Industrial Training / Internship", "Project")],
                8: [subject("BCS 402", "Embedded System Design"), subject("DEC 4XX-V", "Departmental Elective V", "DEC"), subject("DEC 4XX-VI", "Departmental Elective VI", "DEC"), subject("BCS 450", "Major Project", "Project"), subject("GEC 402", "Generic Open Elective III", "GEC")]
            }
        },
        "cse-ai": {
            shortName: "CSE-AI",
            name: "Computer Science & Engineering (Artificial Intelligence)",
            mark: "AI",
            accent: "violet",
            summary: "Computer science foundations with deep learning, NLP and intelligent systems.",
            sourceLabel: "Official IGDTUW CSE-AI curriculum",
            sourceUrl: "https://www.igdtuw.ac.in/IGDTUW/uploads/626872600.pdf",
            semesters: {
                ...aiFoundationYear,
                2: [subject("BAI 102", "Object Oriented Programming using Java"), subject("BAI 104", "Introduction to Data Science"), subject("BAI 106", "Database Management Systems"), subject("BAI 108", "IT Workshop"), subject("BAS 106", "Environmental Science", "BAS"), subject("BAS 108", "Probability and Statistics", "BAS")],
                3: [subject("BAI 201", "Artificial Intelligence"), subject("BCS 201", "Data Structures"), subject("BCS 203", "Discrete Structures"), subject("BIT 203", "Software Engineering"), subject("OEC 2XX", "Open Elective", "OEC"), subject("GEC 201", "Generic Open Elective", "GEC"), subject("BAI 253", "Industrial Training / Internship", "Project")],
                4: [subject("BAI 202", "Computer Networks"), subject("BIT 202", "Operating Systems"), subject("BCS 204", "Design and Analysis of Algorithms"), subject("BAI 204", "Optimization Techniques and Decision Making"), subject("OEC 2XX", "Open Elective", "OEC"), subject("HMC 202", "Disaster Management", "HMC")],
                5: [subject("BAI 301", "Machine Learning"), subject("BAI 303", "Cyber Security"), subject("BAI 305", "Deep Learning I"), subject("BCS 303", "Theory of Computation"), subject("HMC 301", "Professional Ethics and Human Values", "HMC"), subject("BAI 353", "Industrial Training / Internship", "Project"), subject("GEC 301", "Generic Open Elective", "GEC")],
                6: [subject("BAI 302", "Natural Language Processing"), subject("BAI 304", "Deep Learning II"), subject("BAI 306", "Digital Image Processing"), subject("BAI 3XX-I", "Departmental Elective I", "DEC"), subject("BAI 3XX-II", "Departmental Elective II", "DEC"), subject("HMC 30X", "Management Elective", "HMC")],
                7: [subject("BAI 410", "Recent Trends in AI"), subject("BIT 407", "Big Data Analytics"), subject("BAI 401", "Multimodal Data Processing"), subject("DEC 4XX-III", "Departmental Elective III", "DEC"), subject("DEC 4XX-IV", "Departmental Elective IV", "DEC"), subject("BAI 451", "Minor Project", "Project"), subject("BAI 453", "Internship", "Project")],
                8: [subject("HMC 401", "Creativity, Innovation and Entrepreneurship", "HMC"), subject("BAI 4XX-V", "Departmental Elective V", "DEC"), subject("BAI 4XX-VI", "Departmental Elective VI", "DEC"), subject("BAI 452", "Industrial / R&D / Start-up Project", "Project"), subject("GEC 402", "Generic Open Elective", "GEC")]
            }
        },
        it: {
            shortName: "IT",
            name: "Information Technology",
            mark: "IT",
            accent: "cyan",
            summary: "Software platforms, networks, databases and enterprise systems.",
            sourceLabel: "Official IGDTUW IT curriculum",
            sourceUrl: "https://www.igdtuw.ac.in/IGDTUW/uploads/1528885601.pdf",
            semesters: {
                ...commonEngineeringYear,
                3: [subject("BCS 201", "Data Structures"), subject("BIT 201", "Database Management Systems"), subject("BCS 203", "Discrete Structures"), subject("BIT 203", "Software Engineering"), subject("GEC 201", "Generic Open Elective", "GEC"), subject("BIT 253", "Industrial Training / Internship", "Project"), subject("OEC 2XX", "Open Elective", "OEC")],
                4: [subject("BCS 202", "Computer Organization and Architecture"), subject("BIT 202", "Operating Systems"), subject("BCS 204", "Design and Analysis of Algorithms"), subject("BIT 204", "Object Oriented Programming"), subject("OEC 2XX", "Open Elective", "OEC"), subject("HMC 202", "Disaster Management", "HMC")],
                5: [subject("BCS 301", "Artificial Intelligence"), subject("BIT 301", "Data Communication and Computer Networks"), subject("BAS 301", "Modelling and Simulation", "BAS"), subject("BCS 303", "Theory of Computation"), subject("HMC 301", "Professional Ethics and Human Values", "HMC"), subject("BIT 353", "Industrial Training / Internship", "Project"), subject("GEC 301", "Generic Open Elective", "GEC")],
                6: [subject("BCS 302", "Wireless Networks"), subject("BIT 304", "Cloud Computing"), subject("BIT 306", "Data Mining and Machine Learning"), subject("DEC 3XX-I", "Departmental Elective I", "DEC"), subject("DEC 3XX-II", "Departmental Elective II", "DEC"), subject("HMC 30X", "Management Elective", "HMC")],
                7: [subject("BIT 401", "Mobile Computing"), subject("BIT 403", "Software Testing"), subject("DEC 4XX-III", "Departmental Elective III", "DEC"), subject("DEC 4XX-IV", "Departmental Elective IV", "DEC"), subject("BIT 451", "Minor Project", "Project"), subject("BIT 453", "Industrial Training / Internship", "Project")],
                8: [subject("BIT 402", "Information and Network Security"), subject("DEC 4XX-V", "Departmental Elective V", "DEC"), subject("DEC 4XX-VI", "Departmental Elective VI", "DEC"), subject("BIT 452", "Major Project", "Project"), subject("GEC 402", "Generic Open Elective", "GEC")]
            }
        },
        aiml: {
            shortName: "AI & ML",
            name: "Artificial Intelligence & Machine Learning",
            mark: "ML",
            accent: "pink",
            summary: "Machine learning, data mining, vision and responsible AI applications.",
            sourceLabel: "Official IGDTUW AI & ML curriculum",
            sourceUrl: "https://www.igdtuw.ac.in/IGDTUW/uploads/906229228.pdf",
            semesters: {
                ...aiFoundationYear,
                2: [subject("BAI 102", "Object Oriented Programming using Java"), subject("BAM 102", "Fundamentals of Data Structure"), subject("BAI 104", "Introduction to Data Science"), subject("BAI 108", "IT Workshop"), subject("BAS 106", "Environmental Science", "BAS"), subject("BAS 108", "Probability and Statistics", "BAS")],
                3: [subject("BAI 201", "Artificial Intelligence"), subject("BAM 201", "Database Management Systems"), subject("BCS 203", "Discrete Structures"), subject("BIT 203", "Software Engineering"), subject("OEC 2XX", "Open Elective", "OEC"), subject("GEC 201", "Generic Open Elective", "GEC"), subject("BAM 253", "Industrial Training / Internship", "Project")],
                4: [subject("BAI 202", "Computer Networks"), subject("BIT 202", "Operating Systems"), subject("BAM 202", "Machine Learning"), subject("BCS 204", "Design and Analysis of Algorithms"), subject("OEC 2XX", "Open Elective", "OEC"), subject("HMC 202", "Disaster Management", "HMC")],
                5: [subject("BAM 301", "Optimization Techniques and Decision Making"), subject("BAM 303", "Cryptography and Network Security"), subject("BAM 305", "Social Networking and Mining"), subject("BCS 303", "Theory of Computation"), subject("HMC 301", "Professional Ethics and Human Values", "HMC"), subject("BAM 353", "Industrial Training / Internship", "Project"), subject("GEC 301", "Generic Open Elective", "GEC")],
                6: [subject("BAM 302", "Reinforcement Learning"), subject("BAM 304", "Neural Networks and Deep Learning"), subject("BAM 306", "Computer Vision"), subject("BAM/BAI 3XX-I", "Departmental Elective I", "DEC"), subject("BAM/BAI 3XX-II", "Departmental Elective II", "DEC"), subject("HMC 30X", "Management Elective", "HMC")],
                7: [subject("BAI 410", "Recent Trends in AI"), subject("BIT 407", "Big Data Analytics"), subject("BAI 401", "Multimodal Data Processing"), subject("BAM/BAI 4XX-III", "Departmental Elective III", "DEC"), subject("BAM/BAI 4XX-IV", "Departmental Elective IV", "DEC"), subject("BAI 451", "Minor Project", "Project"), subject("BAI 453", "Internship", "Project")],
                8: [subject("HMC 401", "Creativity, Innovation and Entrepreneurship", "HMC"), subject("BAI/BIT 4XX-V", "Departmental Elective V", "DEC"), subject("BAI 4XX-VI", "Departmental Elective VI", "DEC"), subject("BAI 452", "Industrial / R&D / Start-up Project", "Project"), subject("GEC 402", "Generic Open Elective", "GEC")]
            }
        },
        ece: {
            shortName: "ECE",
            name: "Electronics & Communication Engineering",
            mark: "∿",
            accent: "orange",
            summary: "Circuits, communication, signal processing and embedded systems.",
            sourceLabel: "Official IGDTUW ECE curriculum",
            sourceUrl: "https://www.igdtuw.ac.in/IGDTUW/uploads/224310559.pdf",
            semesters: {
                ...commonEngineeringYear,
                3: [subject("BEC 201", "Analog Electronics"), subject("BEC 203", "Signals and Systems"), subject("BEC 205", "Network Analysis and Synthesis"), subject("BEC 207", "Digital Electronics"), subject("GEC 201", "Generic Open Elective", "GEC"), subject("BEC 253", "Industrial Training / Internship", "Project"), subject("OEC 2XX", "Open Elective", "OEC")],
                4: [subject("BEC 202", "Linear Integrated Circuits"), subject("BEC 204", "Digital System Design"), subject("BEC 206", "Electromagnetic Field Theory"), subject("BEC 208", "Communication Systems"), subject("OEC 2XX", "Open Elective", "OEC"), subject("HMC 202", "Disaster Management", "HMC")],
                5: [subject("BEC 301", "Digital Communication Systems"), subject("BAS 301", "Modelling and Simulation", "BAS"), subject("BEC 303", "Control Systems"), subject("DEC 3XX-I", "Departmental Elective I", "DEC"), subject("HMC 301", "Professional Ethics and Human Values", "HMC"), subject("BEC 353", "Industrial Training / Internship", "Project"), subject("GEC 301", "Generic Open Elective", "GEC")],
                6: [subject("BEC 302", "Digital Signal Processing"), subject("BEC 304", "Information Theory and Coding"), subject("BEC 306", "VLSI Design"), subject("BEC 308", "Microprocessors and Microcontrollers"), subject("DEC 3XX-II", "Departmental Elective II", "DEC"), subject("HMC 30X", "Management Elective", "HMC")],
                7: [subject("BEC 401", "Microwave Techniques"), subject("BEC 403", "Wireless and Mobile Communication"), subject("DEC 4XX-III", "Departmental Elective III", "DEC"), subject("DEC 4XX-IV", "Departmental Elective IV", "DEC"), subject("BEC 451", "Minor Project", "Project"), subject("BEC 453", "Industrial Training / Internship", "Project")],
                8: [subject("BEC 402", "Embedded Systems"), subject("DEC 4XX-V", "Departmental Elective V", "DEC"), subject("DEC 4XX-VI", "Departmental Elective VI", "DEC"), subject("BEC 452", "Major Project", "Project"), subject("GEC 402", "Generic Open Elective", "GEC")]
            }
        },
        "ece-ai": {
            shortName: "ECE-AI",
            name: "Electronics & Communication Engineering (Artificial Intelligence)",
            mark: "E+",
            accent: "amber",
            summary: "Electronics and communication engineering enhanced with applied AI.",
            sourceLabel: "Official IGDTUW ECE-AI curriculum",
            sourceUrl: "https://www.igdtuw.ac.in/IGDTUW/uploads/740311488.pdf",
            semesters: {
                1: [subject("BEC 101", "Analog Electronics"), subject("BEC 110", "Basic Electrical Engineering"), subject("BCS 110", "Programming in C Language"), subject("BAI 101", "Intelligent Systems"), subject("BAS 109", "Applied Mathematics", "BAS"), subject("HMC 110", "Communication Skills", "HMC")],
                2: [subject("BEC 104", "Digital Electronics"), subject("BEC 106", "Signals and Systems"), subject("BAI 110", "Programming with Python"), subject("BAS 106", "Environmental Sciences", "BAS"), subject("BAS 108", "Probability and Statistics", "BAS"), subject("BAI 108", "IT Workshop")],
                3: [subject("BEC 205", "Network Analysis and Synthesis"), subject("BEC 211", "Communication Systems"), subject("BAI 205", "Neural Networks and Artificial Intelligence"), subject("BCS 201", "Data Structures"), subject("GEC 201", "Generic Open Elective", "GEC"), subject("BEC 253", "Industrial Training / Internship", "Project"), subject("OEC 2XX", "Open Elective", "OEC")],
                4: [subject("BEC 202", "Linear Integrated Circuits"), subject("BEC 206", "Electromagnetic Field Theory"), subject("BEC 210", "Digital Communication Systems"), subject("BAI 204", "Optimization Techniques and Decision Making"), subject("OEC 2XX", "Open Elective", "OEC"), subject("HMC 202", "Disaster Management", "HMC")],
                5: [subject("BEC 303", "Control Systems"), subject("BEC 311", "Digital Signal Processing"), subject("BAI 301", "Machine Learning"), subject("BAI 307", "Computer Networks"), subject("HMC 301", "Professional Ethics and Human Values", "HMC"), subject("BEC 353", "Industrial Training / Internship", "Project"), subject("GEC 301", "Generic Open Elective", "GEC")],
                6: [subject("BEC 306", "VLSI Design"), subject("BEC 308", "Microprocessors and Microcontrollers"), subject("BEC 318", "Digital Image Processing"), subject("DEC 3XX-I", "Departmental Elective I", "DEC"), subject("DEC 3XX-II", "Departmental Elective II", "DEC"), subject("HMC 30X", "Management Elective", "HMC")],
                7: [subject("BEC 403", "Wireless and Mobile Communication"), subject("BAI 417", "Multimodal Data Analysis"), subject("BAI 413", "Deep Learning"), subject("DEC 4XX-III", "Departmental Elective III", "DEC"), subject("DEC 4XX-IV", "Departmental Elective IV", "DEC"), subject("BAI 451", "Minor Project", "Project"), subject("BEC 453", "Industrial Training / Internship", "Project")],
                8: [subject("BAI 418", "Recent Trends in AI"), subject("DEC 4XX-V", "Departmental Elective V", "DEC"), subject("DEC 4XX-VI", "Departmental Elective VI", "DEC"), subject("BAI 452", "Major / R&D / Start-up Project", "Project"), subject("GEC 402", "Generic Open Elective", "GEC")]
            }
        },
        mae: {
            shortName: "MAE",
            name: "Mechanical & Automation Engineering",
            mark: "⚙",
            accent: "green",
            summary: "Manufacturing, machines, automation, mechatronics and robotics.",
            sourceLabel: "Official IGDTUW MAE curriculum",
            sourceUrl: "https://www.igdtuw.ac.in/IGDTUW/uploads/1215334865.pdf",
            semesters: {
                ...commonEngineeringYear,
                3: [subject("BMA 201", "Production Technology I"), subject("BMA 203", "Strength of Materials"), subject("BMA 205", "Thermal Engineering I"), subject("BAS 205", "Numerical Techniques for Engineers", "BAS"), subject("BMA 207", "Machine Drawing Lab"), subject("BMA 253", "Industrial Training", "Project"), subject("GEC 201", "Generic Open Elective I", "GEC"), subject("OEC 2XX", "Open Elective", "OEC")],
                4: [subject("BMA 202", "Production Technology II"), subject("BMA 204", "Theory of Machines"), subject("BMA 206", "Engineering Materials"), subject("BMA 208", "Thermal Engineering II"), subject("OEC 2XX", "Open Elective", "OEC"), subject("HMC 202", "Disaster Management", "HMC")],
                5: [subject("BMA 301", "Machine Design"), subject("BMA 303", "Fluid Mechanics and Hydraulic Machines"), subject("BMA 305", "Automobile Engineering"), subject("BMA 3XX-I", "Departmental Elective I", "DEC"), subject("HMC 301", "Professional Ethics and Human Values", "HMC"), subject("BMA 353", "Industrial Training", "Project"), subject("GEC 301", "Generic Open Elective II", "GEC")],
                6: [subject("BMA 304", "Heat Transfer"), subject("BMA 306", "Computer Aided Design"), subject("BMA 308", "Production Management"), subject("BMA 310", "Advanced Machine Design Lab"), subject("BMA 3YY-II", "Departmental Elective II", "DEC"), subject("BMA 3ZZ-III", "Departmental Elective III", "DEC"), subject("HMC 30X", "Management Elective", "HMC")],
                7: [subject("BMA 401", "Finite Element Analysis"), subject("BMA 403", "Mechatronics"), subject("BMA 451", "Minor Project", "Project"), subject("BMA 453", "Industrial Training / Internship", "Project"), subject("BMA 4XX-IV", "Departmental Elective IV", "DEC"), subject("BMA 4YY-V", "Departmental Elective V", "DEC")],
                8: [subject("BMA 402", "Computer Aided Manufacturing"), subject("BMA 404", "Robotics and Computer Integrated Manufacturing"), subject("BMA 452", "Major Project", "Project"), subject("BMA 4ZZ-VI", "Departmental Elective VI", "DEC"), subject("GEC 402", "Generic Open Elective III", "GEC")]
            }
        }
    };

    window.EXAMFORGE_CURRICULUM = {
        university: "IGDTUW",
        catalogueUrl: "https://www.igdtuw.ac.in/academics/scheme-syllabus",
        branches
    };
})();
