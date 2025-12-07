// ========== Task Manager Application ==========

// State management
let tasks = [];
let currentFilter = 'all';

// DOM elements
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const totalTasksEl = document.getElementById('total-tasks');
const activeTasksEl = document.getElementById('active-tasks');
const completedTasksEl = document.getElementById('completed-tasks');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clear-completed');
const darkModeToggle = document.getElementById('dark-mode-toggle');

// ========== Initialize Application ==========
function init() {
    loadTasks();
    loadDarkMode();
    renderTasks();
    updateStats();
    attachEventListeners();
}

// ========== Event Listeners ==========
function attachEventListeners() {
    // Form submission
    taskForm.addEventListener('submit', handleAddTask);

    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', handleFilterChange);
    });

    // Clear completed button
    clearCompletedBtn.addEventListener('click', handleClearCompleted);

    // Dark mode toggle
    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// ========== Task Operations ==========

// Add new task
function handleAddTask(e) {
    e.preventDefault();
    
    const taskText = taskInput.value.trim();
    
    // Input validation: prevent empty tasks
    if (!taskText || taskText.length === 0) {
        taskInput.value = '';
        taskInput.focus();
        announceToScreenReader('Cannot add empty task');
        return;
    }

    // Additional validation: check for minimum length
    if (taskText.length < 1) {
        announceToScreenReader('Task text is too short');
        return;
    }

    const newTask = {
        id: generateId(),
        text: taskText, // Already trimmed
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask); // Add to beginning of array
    taskInput.value = '';
    taskInput.focus();

    saveTasks();
    renderTasks();
    updateStats();

    // Announce to screen readers
    announceToScreenReader(`Task added: ${taskText}`);
}

// Toggle task completion
function handleToggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateStats();

        // Announce to screen readers
        const status = task.completed ? 'completed' : 'marked as active';
        announceToScreenReader(`Task ${status}: ${task.text}`);
    }
}

// Delete task
function handleDeleteTask(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex !== -1) {
        const task = tasks[taskIndex];
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        
        // Add removing animation
        if (taskElement) {
            taskElement.classList.add('removing');
            
            setTimeout(() => {
                tasks.splice(taskIndex, 1);
                saveTasks();
                renderTasks();
                updateStats();

                // Announce to screen readers
                announceToScreenReader(`Task deleted: ${task.text}`);
            }, 300);
        }
    }
}

// Clear all completed tasks
function handleClearCompleted() {
    const completedCount = tasks.filter(t => t.completed).length;
    
    if (completedCount === 0) {
        return;
    }

    if (confirm(`Delete ${completedCount} completed task${completedCount > 1 ? 's' : ''}?`)) {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        renderTasks();
        updateStats();

        announceToScreenReader(`${completedCount} completed task${completedCount > 1 ? 's' : ''} deleted`);
    }
}

// ========== Filter Operations ==========
function handleFilterChange(e) {
    const filter = e.target.dataset.filter;
    
    if (filter) {
        currentFilter = filter;
        
        // Update active button
        filterBtns.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        renderTasks();
        announceToScreenReader(`Showing ${filter} tasks`);
    }
}

function getFilteredTasks() {
    switch (currentFilter) {
        case 'active':
            return tasks.filter(t => !t.completed);
        case 'completed':
            return tasks.filter(t => t.completed);
        default:
            return tasks;
    }
}

// ========== Render Functions ==========
function renderTasks() {
    const filteredTasks = getFilteredTasks();
    
    // Clear task list
    taskList.innerHTML = '';
    
    // Show/hide empty state
    if (filteredTasks.length === 0) {
        emptyState.classList.remove('hidden');
        
        // Update empty state message based on filter
        const emptyMessage = emptyState.querySelector('p');
        if (currentFilter === 'active') {
            emptyMessage.textContent = 'No active tasks. Great job!';
        } else if (currentFilter === 'completed') {
            emptyMessage.textContent = 'No completed tasks yet.';
        } else {
            emptyMessage.textContent = 'No tasks yet. Add one above to get started!';
        }
    } else {
        emptyState.classList.add('hidden');
        
        // Render each task
        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    }
}

function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.setAttribute('data-task-id', task.id);
    li.setAttribute('role', 'listitem');

    // Create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.id = `task-${task.id}`;
    checkbox.setAttribute('aria-label', `Mark task as ${task.completed ? 'incomplete' : 'complete'}`);
    checkbox.addEventListener('change', () => handleToggleTask(task.id));

    // Create label
    const label = document.createElement('label');
    label.className = 'task-text';
    label.htmlFor = `task-${task.id}`;
    label.textContent = task.text;

    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
    deleteBtn.addEventListener('click', () => handleDeleteTask(task.id));

    // Append elements
    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(deleteBtn);

    return li;
}

function updateStats() {
    const total = tasks.length;
    const active = tasks.filter(t => !t.completed).length;
    const completed = tasks.filter(t => t.completed).length;

    totalTasksEl.textContent = total;
    activeTasksEl.textContent = active;
    completedTasksEl.textContent = completed;

    // Enable/disable clear completed button
    clearCompletedBtn.disabled = completed === 0;
}

// ========== Local Storage ==========
function saveTasks() {
    try {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (error) {
        console.error('Error saving tasks:', error);
        announceToScreenReader('Error saving tasks');
    }
}

function loadTasks() {
    try {
        const storedTasks = localStorage.getItem('tasks');
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        tasks = [];
    }
}

// ========== Utility Functions ==========
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'visually-hidden';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// ========== Keyboard Shortcuts ==========
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K: Focus on input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        taskInput.focus();
    }
    
    // Escape: Clear input
    if (e.key === 'Escape' && document.activeElement === taskInput) {
        taskInput.value = '';
    }
}

// ========== Dark Mode ==========

// Toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    announceToScreenReader(`Dark mode ${isDarkMode ? 'enabled' : 'disabled'}`);
}

// Load dark mode preference
function loadDarkMode() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
}

// ========== Initialize on DOM Load ==========
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ========== Export for testing (optional) ==========
// Uncomment if you want to test functions in console
// window.taskManager = {
//     tasks,
//     addTask: handleAddTask,
//     deleteTask: handleDeleteTask,
//     toggleTask: handleToggleTask,
//     clearCompleted: handleClearCompleted
// };
