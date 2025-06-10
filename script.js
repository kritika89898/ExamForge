// Global state management
let currentState = {
    department: '',
    year: '',
    semester: '',
    examType: '',
    view: 'departments'
};

// Department data
const departments = {
    'cse': { name: 'Computer Science', shortName: 'CSE' },
    'cse-ai': { name: 'CSEAI', shortName: 'CSE (AI)' },
    'aiml': { name: 'AI & Machine Learning', shortName: 'AIML' },
    'ece': { name: 'Electronics & Communication', shortName: 'ECE' }
};

// Year data
const years = {
    '1': { name: '1st Year', semester: 'Foundation courses' },
    '2': { name: '2nd Year', semester: 'Core subjects' },
    '3': { name: '3rd Year', semester: 'Advanced topics' },
    '4': { name: '4th Year', semester: 'Specialization & Projects' }
};

// Semester data
const semesters = {
    '1': { odd: '1st Semester', even: '2nd Semester' },
    '2': { odd: '3rd Semester', even: '4th Semester' },
    '3': { odd: '5th Semester', even: '6th Semester' },
    '4': { odd: '7th Semester', even: '8th Semester' }
};

// Exam types
const examTypes = {
    'mid': { name: 'Mid Term', icon: '📝' },
    'end': { name: 'End Term', icon: '📋' }
};

// Sample subjects data
const subjectsData = {
    'cn': {
        name: 'Computer Networks',
        code: 'CS204',
        description: 'Network protocols, TCP/IP, routing algorithms, and network security concepts.',
        pyqs: {
            mid: {
                2022: 'https://drive.google.com/file/d/1-p_wfJ39Z5eQ4JK2SWofMuODZV5tX6MU/view?usp=sharing',
                2023: 'https://drive.google.com/file/d/1-r4R38-ybzRAnf93SKaqjZ8ZcMGnt0xN/view?usp=sharing',
                2024: 'https://drive.google.com/file/d/1ebFq5Oss7N5kKTw-0J2gH31hnsp15Rhn/view?usp=sharing'
            },
            end: {
                2022: 'https://drive.google.com/file/d/1PvCTZupJbGceoAcwr97rV-ta7ROX-SlF/view?usp=sharing',
                2023: 'https://drive.google.com/file/d/1Eeob3s0Fg56yEpQDUjWAfEKIYRAPKSjS/view?usp=sharing',
                2024: 'https://drive.google.com/file/d/16TacdaquRLZT7AhQkzqZj97QLr18rQtS/view?usp=sharing'
            }
        },
        solutions: {
            mid: { 2023: '#', 2024: '#' },
            end: { 2022: '#', 2024: '#' }
        },
        aiPredicted: true
    },
    'os': {
        name: 'Operating Systems',
        code: 'CS203',
        description: 'Process management, memory management, file systems, and scheduling algorithms.',
        pyqs: {
            mid: { 2022: '#', 2023: '#', 2024: '#' },
            end: { 2022: '#', 2023: '#', 2024: '#' }
        },
        solutions: {
            mid: { 2023: '#' },
            end: { 2024: '#' }
        },
        aiPredicted: true
    },
    'dsa': {
        name: 'Data Structures & Algorithms',
        code: 'CS201',
        description: 'Arrays, linked lists, trees, graphs, sorting algorithms, and more.',
        pyqs: {
            mid: { 2022: '#', 2023: '#', 2024: '#' },
            end: { 2022: '#', 2023: '#', 2024: '#' }
        },
        solutions: {
            mid: { 2023: '#', 2024: '#' },
            end: { 2022: '#', 2024: '#' }
        },
        aiPredicted: true
    },
    'dbms': {
        name: 'Database Management Systems',
        code: 'CS202',
        description: 'SQL, normalization, transactions, query optimization, and DBMS architecture.',
        pyqs: {
            mid: { 2022: '#', 2023: '#', 2024: '#' },
            end: { 2022: '#', 2023: '#', 2024: '#' }
        },
        solutions: {
            mid: { 2023: '#' },
            end: { 2024: '#' }
        },
        aiPredicted: true
    },
    'se': {
        name: 'Software Engineering',
        code: 'CS205',
        description: 'SDLC, agile methodologies, software testing, and project management.',
        pyqs: {
            mid: { 2022: '#', 2023: '#', 2024: '#' },
            end: { 2022: '#', 2023: '#', 2024: '#' }
        },
        solutions: {
            mid: { 2023: '#', 2024: '#' },
            end: { 2022: '#', 2024: '#' }
        },
        aiPredicted: true
    },
    'ml': {
        name: 'Machine Learning',
        code: 'CS206',
        description: 'Supervised and unsupervised learning, neural networks, and model evaluation.',
        pyqs: {
            mid: { 2022: '#', 2023: '#', 2024: '#' },
            end: { 2022: '#', 2023: '#', 2024: '#' }
        },
        solutions: {
            mid: { 2023: '#' },
            end: { 2024: '#' }
        },
        aiPredicted: true
    }
};

// Blur text animation functions
function animateBlurText() {
    // Animate stats items with staggered delays
    const statsItems = document.querySelectorAll('.stats-item');
    statsItems.forEach((item, index) => {
        const delay = parseInt(item.dataset.delay) || index * 100;
        setTimeout(() => {
            item.style.animationDelay = `${delay}ms`;
        }, delay);
    });
}

function triggerBlurReveal(element) {
    if (element && !element.classList.contains('blur-revealed')) {
        element.classList.add('blur-revealed');
        element.style.animationPlayState = 'running';
    }
}

function createLetterBlurEffect(element, text) {
    element.innerHTML = '';
    element.classList.add('blur-letters');
    
    text.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.className = 'blur-letter';
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.animationDelay = `${index * 50}ms`;
        element.appendChild(span);
        
        setTimeout(() => {
            span.classList.add('revealed');
        }, index * 50 + 100);
    });
}

// Intersection Observer for reveal animations
function setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.classList.contains('blur-reveal-text')) {
                    triggerBlurReveal(entry.target);
                }
                if (entry.target.classList.contains('cta-card')) {
                    entry.target.style.animationPlayState = 'running';
                }
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Observe all blur reveal elements
    document.querySelectorAll('.blur-reveal-text, .cta-card').forEach(el => {
        observer.observe(el);
    });
}

// Utility functions
function convertGoogleDriveLink(link) {
    if (!link || link === '#') return '#';
    const fileId = link.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return fileId ? `https://drive.google.com/uc?export=download&id=${fileId[1]}` : link;
}

function hideAllViews() {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.add('hidden');
    });
}

function updateBreadcrumb() {
    const breadcrumb = document.getElementById('breadcrumb');
    let breadcrumbHTML = '<button onclick="showDepartments()" class="text-blue-400 hover:text-blue-300 transition-colors">🏠 Home</button>';
    
    if (currentState.department) {
        breadcrumbHTML += '<span class="text-gray-500"> / </span>';
        breadcrumbHTML += `<button onclick="showYears()" class="text-blue-400 hover:text-blue-300 transition-colors">${departments[currentState.department].shortName}</button>`;
    }
    
    if (currentState.year) {
        breadcrumbHTML += '<span class="text-gray-500"> / </span>';
        breadcrumbHTML += `<button onclick="showSemesters()" class="text-blue-400 hover:text-blue-300 transition-colors">${years[currentState.year].name}</button>`;
    }
    
    if (currentState.semester) {
        breadcrumbHTML += '<span class="text-gray-500"> / </span>';
        breadcrumbHTML += `<button onclick="showExamTypes()" class="text-blue-400 hover:text-blue-300 transition-colors">${semesters[currentState.year][currentState.semester]}</button>`;
    }
    
    if (currentState.examType) {
        breadcrumbHTML += '<span class="text-gray-500"> / </span>';
        breadcrumbHTML += `<span class="text-gray-300">${examTypes[currentState.examType].name}</span>`;
    }
    
    breadcrumb.innerHTML = breadcrumbHTML;
}

// Navigation functions
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.toggle('hidden');
}

function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.add('hidden');
}

function scrollToCTA() {
    document.getElementById('cta-section').scrollIntoView({ behavior: 'smooth' });
}

// View functions
function showDepartments() {
    currentState = { department: '', year: '', semester: '', examType: '', view: 'departments' };
    hideAllViews();
    document.getElementById('departments-view').classList.remove('hidden');
    updateBreadcrumb();
    
    // Trigger reveal animation for the title
    setTimeout(() => {
        const title = document.querySelector('#departments-view .blur-reveal-text');
        triggerBlurReveal(title);
    }, 100);
}

function showYears() {
    currentState.view = 'years';
    currentState.semester = '';
    currentState.examType = '';
    hideAllViews();
    document.getElementById('years-view').classList.remove('hidden');
    document.getElementById('years-title').textContent = `Select Year - ${departments[currentState.department].shortName}`;
    updateBreadcrumb();
    
    // Trigger reveal animation for the title
    setTimeout(() => {
        const title = document.querySelector('#years-view .blur-reveal-text');
        triggerBlurReveal(title);
    }, 100);
}

function showSemesters() {
    currentState.view = 'semesters';
    currentState.examType = '';
    hideAllViews();
    document.getElementById('semester-view').classList.remove('hidden');
    document.getElementById('semester-title').textContent = `Select Semester - ${years[currentState.year].name}`;
    
    // Update semester titles
    document.getElementById('odd-semester-title').textContent = semesters[currentState.year].odd;
    document.getElementById('even-semester-title').textContent = semesters[currentState.year].even;
    
    updateBreadcrumb();
    
    // Trigger reveal animation for the title
    setTimeout(() => {
        const title = document.querySelector('#semester-view .blur-reveal-text');
        triggerBlurReveal(title);
    }, 100);
}

function showExamTypes() {
    currentState.view = 'examTypes';
    hideAllViews();
    document.getElementById('exam-types-view').classList.remove('hidden');
    document.getElementById('exam-types-title').textContent = `Select Exam Type - ${semesters[currentState.year][currentState.semester]}`;
    updateBreadcrumb();
    
    // Trigger reveal animation for the title
    setTimeout(() => {
        const title = document.querySelector('#exam-types-view .blur-reveal-text');
        triggerBlurReveal(title);
    }, 100);
}

function showSubjects() {
    currentState.view = 'subjects';
    hideAllViews();
    document.getElementById('subjects-view').classList.remove('hidden');
    document.getElementById('subjects-title').textContent = `${examTypes[currentState.examType].name} Subjects - ${semesters[currentState.year][currentState.semester]}`;
    
    // Populate subjects
    const container = document.getElementById('subjects-container');
    container.innerHTML = '';
    
    Object.keys(subjectsData).forEach((subjectId, index) => {
        const subject = subjectsData[subjectId];
        const subjectCard = createSubjectCard(subject, index);
        container.appendChild(subjectCard);
    });
    
    updateBreadcrumb();
    
    // Trigger reveal animation for the title
    setTimeout(() => {
        const title = document.querySelector('#subjects-view .blur-reveal-text');
        triggerBlurReveal(title);
    }, 100);
}

function createSubjectCard(subject, index) {
    const card = document.createElement('div');
    card.className = 'bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all duration-300';
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.animation = `cardFadeIn 0.8s ease-out ${index * 0.1}s forwards`;
    
    // Create year buttons for PYQs
    const pyqButtons = ['2022', '2023', '2024'].map(year => {
        const link = subject.pyqs[currentState.examType] && subject.pyqs[currentState.examType][year];
        const isAvailable = link && link !== '#';
        
        return `
            <a href="${isAvailable ? convertGoogleDriveLink(link) : '#'}" 
               target="_blank" 
               rel="noopener noreferrer"
               class="text-center py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                   isAvailable 
                       ? 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105' 
                       : 'bg-gray-700 text-gray-500 cursor-not-allowed'
               }">
                ${year}
            </a>
        `;
    }).join('');
    
    // Create year buttons for Solutions
    const solutionButtons = ['2022', '2023', '2024'].map(year => {
        const link = subject.solutions[currentState.examType] && subject.solutions[currentState.examType][year];
        const isAvailable = link && link !== '#';
        
        return `
            <a href="${isAvailable ? convertGoogleDriveLink(link) : '#'}" 
               target="_blank" 
               rel="noopener noreferrer"
               class="text-center py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                   isAvailable 
                       ? 'bg-green-600 hover:bg-green-700 text-white transform hover:scale-105' 
                       : 'bg-gray-700 text-gray-500 cursor-not-allowed'
               }">
                ${year}
            </a>
        `;
    }).join('');
    
    card.innerHTML = `
        <div class="flex items-start justify-between mb-4">
            <div>
                <h3 class="text-xl font-semibold text-white mb-1">${subject.name}</h3>
                <p class="text-blue-400 text-sm font-medium">${subject.code}</p>
            </div>
            ${subject.aiPredicted ? '<span class="bg-purple-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"><span>🤖</span> AI Ready</span>' : ''}
        </div>
        
        <p class="text-gray-400 text-sm mb-6">${subject.description}</p>
        
        <div class="space-y-4">
            <div>
                <h4 class="text-white font-medium mb-3 flex items-center gap-2">
                    <span>📋</span> Past Question Papers
                    <span class="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">3 years</span>
                </h4>
                <div class="grid grid-cols-3 gap-2">
                    ${pyqButtons}
                </div>
            </div>
            
            <div>
                <h4 class="text-white font-medium mb-3 flex items-center gap-2">
                    <span>📖</span> Solutions
                    <span class="text-xs bg-green-900 text-green-300 px-2 py-1 rounded">Available</span>
                </h4>
                <div class="grid grid-cols-3 gap-2">
                    ${solutionButtons}
                </div>
            </div>
            
            ${subject.aiPredicted ? `
                <button onclick="generateAIPredictedPaper('${subject.code}')" class="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2">
                    <span>🤖</span> Generate AI Predicted Paper
                </button>
            ` : ''}
            
            <div class="mt-4 pt-4 border-t border-gray-700">
                <div class="flex justify-between text-xs text-gray-400">
                    <span>📊 Difficulty: Medium</span>
                    <span>⏱️ Exam Duration: 3hrs</span>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

function generateAIPredictedPaper(subjectCode) {
    // Create a modal or notification with blur effect
    const subject = Object.values(subjectsData).find(s => s.code === subjectCode);
    
    // Create modal with blur background
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-gray-800 rounded-xl p-8 max-w-md w-full border border-gray-600 transform scale-95 opacity-0 transition-all duration-300" id="ai-modal">
            <div class="text-center">
                <div class="text-4xl mb-4">🤖</div>
                <h3 class="text-xl font-bold text-white mb-4">AI Predicted Paper</h3>
                <p class="text-gray-300 mb-6">
                    Generate a predicted question paper for <strong>${subject.name} (${subjectCode})</strong> based on:
                </p>
                <ul class="text-sm text-gray-400 text-left mb-6 space-y-2">
                    <li>• Previous year patterns</li>
                    <li>• Important topics analysis</li>
                    <li>• Difficulty distribution</li>
                    <li>• Current syllabus trends</li>
                </ul>
                <div class="flex gap-3">
                    <button onclick="closeModal()" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button onclick="startAIGeneration('${subjectCode}')" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors">
                        Generate Now
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animate modal in
    setTimeout(() => {
        const modalContent = modal.querySelector('#ai-modal');
        modalContent.style.transform = 'scale(1)';
        modalContent.style.opacity = '1';
    }, 10);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function closeModal() {
    const modal = document.querySelector('.fixed.inset-0');
    if (modal) {
        const modalContent = modal.querySelector('#ai-modal');
        modalContent.style.transform = 'scale(0.95)';
        modalContent.style.opacity = '0';
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

function startAIGeneration(subjectCode) {
    closeModal();
    alert(`🤖 AI Generation started for ${subjectCode}!\n\nThis feature will be implemented with AI API integration.`);
}

function searchSubjects() {
    const query = document.getElementById('search-input').value.toLowerCase();
    if (!query) return;
    
    // Filter subjects based on search query
    const filteredSubjects = Object.entries(subjectsData).filter(([id, subject]) => 
        subject.name.toLowerCase().includes(query) || 
        subject.code.toLowerCase().includes(query) ||
        subject.description.toLowerCase().includes(query)
    );
    
    if (filteredSubjects.length > 0) {
        // Create search results modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-gray-800 rounded-xl p-6 max-w-lg w-full border border-gray-600" id="search-modal">
                <h3 class="text-xl font-bold text-white mb-4">Search Results for "${query}"</h3>
                <div class="space-y-3 mb-6">
                    ${filteredSubjects.map(([id, subject]) => `
                        <div class="bg-gray-700 rounded-lg p-3">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h4 class="text-white font-medium">${subject.name}</h4>
                                    <p class="text-blue-400 text-sm">${subject.code}</p>
                                </div>
                                <span class="text-xs bg-purple-600 text-white px-2 py-1 rounded">Available</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button onclick="closeModal()" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
                    Close
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    } else {
        alert(`No subjects found matching "${query}". Try searching with:\n• Subject name (e.g., "Computer Networks")\n• Subject code (e.g., "CS204")\n• Keywords (e.g., "network", "database")`);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize blur text animations
    animateBlurText();
    
    // Setup intersection observer for scroll-triggered animations
    setupIntersectionObserver();
    
    // Mobile menu toggle
    document.getElementById('mobile-menu-btn').addEventListener('click', toggleMobileMenu);
    
    // Search on Enter key
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchSubjects();
        }
    });
    
    // Department cards click handlers
    document.querySelectorAll('.department-card').forEach(card => {
        card.addEventListener('click', function() {
            currentState.department = this.dataset.dept;
            showYears();
        });
    });
    
    // Year cards click handlers
    document.querySelectorAll('.year-card').forEach(card => {
        card.addEventListener('click', function() {
            currentState.year = this.dataset.year;
            showSemesters();
        });
    });
    
    // Semester cards click handlers
    document.querySelectorAll('.semester-card').forEach(card => {
        card.addEventListener('click', function() {
            currentState.semester = this.dataset.semester;
            showExamTypes();
        });
    });
    
    // Exam type cards click handlers
    document.querySelectorAll('.exam-type-card').forEach(card => {
        card.addEventListener('click', function() {
            currentState.examType = this.dataset.exam;
            showSubjects();
        });
    });
    
    // Initialize with departments view
    showDepartments();
});

// Export functions for global access
window.showDepartments = showDepartments;
window.showYears = showYears;
window.showSemesters = showSemesters;
window.showExamTypes = showExamTypes;
window.showSubjects = showSubjects;
window.generateAIPredictedPaper = generateAIPredictedPaper;
window.searchSubjects = searchSubjects;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.scrollToCTA = scrollToCTA;
window.closeModal = closeModal;
window.startAIGeneration = startAIGeneration;