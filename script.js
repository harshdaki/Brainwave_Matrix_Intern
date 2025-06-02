document.addEventListener("DOMContentLoaded", function () {
  // Set current year in footer
  document.getElementById("currentYear").textContent = new Date().getFullYear();

  // Theme toggle functionality
  const themeToggle = document.getElementById("themeToggle");
  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

  // Check for saved theme preference or use OS preference
  const currentTheme = localStorage.getItem("theme");
  if (currentTheme === "dark" || (!currentTheme && prefersDarkScheme.matches)) {
    document.body.classList.add("dark-mode");
    themeToggle.querySelector("i").classList.remove("fa-moon");
    themeToggle.querySelector("i").classList.add("fa-sun");
  }

  themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
    const theme = document.body.classList.contains("dark-mode")
      ? "dark"
      : "light";
    localStorage.setItem("theme", theme);

    const icon = themeToggle.querySelector("i");
    if (theme === "dark") {
      icon.classList.remove("fa-moon");
      icon.classList.add("fa-sun");
    } else {
      icon.classList.remove("fa-sun");
      icon.classList.add("fa-moon");
    }
  });

  // Background slideshow
  const backgroundSlides = document.querySelectorAll(".background-slide");
  let currentSlide = 0;

  function showSlide(index) {
    backgroundSlides.forEach((slide, i) => {
      slide.classList.toggle("active", i === index);
    });
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % backgroundSlides.length;
    showSlide(currentSlide);
  }

  // Start slideshow
  showSlide(0);
  setInterval(nextSlide, 6000);

  // Task management
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  // Priority selection
  const priorityOptions = document.querySelectorAll(".priority-option");
  const taskPriorityInput = document.getElementById("taskPriority");

  priorityOptions.forEach((option) => {
    option.addEventListener("click", function () {
      priorityOptions.forEach((opt) => opt.classList.remove("selected"));
      this.classList.add("selected");
      taskPriorityInput.value = this.dataset.priority;
    });
  });

  // Task form submission
  const taskForm = document.getElementById("taskForm");
  taskForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const title = document.getElementById("taskTitle").value;
    const category = document.getElementById("taskCategory").value;
    const due = document.getElementById("taskDue").value;
    const description = document.getElementById("taskDescription").value;
    const priority = taskPriorityInput.value;

    if (!priority) {
      showNotification("Please select a priority", "error");
      return;
    }

    const newTask = {
      id: Date.now(),
      title,
      category,
      due,
      description,
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();
    taskForm.reset();
    priorityOptions.forEach((opt) => opt.classList.remove("selected"));
    taskPriorityInput.value = "";

    showNotification("Task added successfully!");
  });

  // Clear all tasks functionality
  const clearAllBtn = document.getElementById("clearAllBtn");
  const clearAllModal = document.getElementById("clearAllModal");
  const confirmClear = document.getElementById("confirmClear");
  const cancelClear = document.getElementById("cancelClear");

  clearAllBtn.addEventListener("click", function () {
    if (tasks.length === 0) {
      showNotification("No tasks to clear", "info");
      return;
    }
    clearAllModal.classList.add("active");
  });

  confirmClear.addEventListener("click", function () {
    tasks = [];
    saveTasks();
    renderTasks();
    clearAllModal.classList.remove("active");
    showNotification("All tasks cleared successfully!");
  });

  cancelClear.addEventListener("click", function () {
    clearAllModal.classList.remove("active");
  });

  // Close modal when clicking outside
  clearAllModal.addEventListener("click", function (e) {
    if (e.target === clearAllModal) {
      clearAllModal.classList.remove("active");
    }
  });

  // Filter tasks
  const categoryFilter = document.getElementById("categoryFilter");
  const statusFilter = document.getElementById("statusFilter");

  categoryFilter.addEventListener("change", renderTasks);
  statusFilter.addEventListener("change", renderTasks);

  // Render tasks
  function renderTasks() {
    const category = categoryFilter.value;
    const status = statusFilter.value;

    const filteredTasks = tasks.filter((task) => {
      const matchesCategory = !category || task.category === category;
      const matchesStatus =
        status === "all" ||
        (status === "active" && !task.completed) ||
        (status === "completed" && task.completed);

      return matchesCategory && matchesStatus;
    });

    // Clear all task lists
    document.querySelectorAll(".task-list").forEach((list) => {
      list.innerHTML = "";
    });

    if (filteredTasks.length === 0) {
      document.querySelectorAll(".task-list").forEach((list) => {
        list.innerHTML = '<li class="empty-state">No tasks found</li>';
      });
    } else {
      filteredTasks.forEach((task) => {
        const taskList = document.getElementById(`${task.priority}Tasks`);
        const taskItem = createTaskElement(task);
        taskList.appendChild(taskItem);
      });
    }

    updateProgress();
  }

  // Create task element
  function createTaskElement(task) {
    const li = document.createElement("li");
    li.className = `task-item ${task.completed ? "completed" : ""}`;
    li.dataset.id = task.id;
    li.draggable = true;

    const categoryMap = {
      work: { name: "Work", class: "category-work" },
      meeting: { name: "Meeting", class: "category-meeting" },
      appointment: { name: "Appointment", class: "category-appointment" },
      personal: { name: "Personal", class: "category-personal" },
      study: { name: "Study", class: "category-study" },
      exercise: { name: "Exercise", class: "category-exercise" },
    };

    const categoryInfo = categoryMap[task.category] || {
      name: task.category,
      class: "",
    };

    li.innerHTML = `
                  <div class="task-header">
                      <span class="task-category ${categoryInfo.class}">${
      categoryInfo.name
    }</span>
                      <div class="task-actions">
                          <button class="task-action complete-btn" title="Mark as ${
                            task.completed ? "active" : "completed"
                          }">
                              <i class="fas fa-${
                                task.completed ? "undo" : "check"
                              }"></i>
                          </button>
                          <button class="task-action edit-btn" title="Edit">
                              <i class="fas fa-edit"></i>
                          </button>
                          <button class="task-action delete-btn" title="Delete">
                              <i class="fas fa-trash-alt"></i>
                          </button>
                      </div>
                  </div>
                  <div class="task-content">${task.title}</div>
                  ${
                    task.description
                      ? `<div class="task-description">${task.description}</div>`
                      : ""
                  }
                  <div class="task-due">Due: ${formatDateTime(task.due)}</div>
              `;

    // Add event listeners
    li.querySelector(".complete-btn").addEventListener("click", () =>
      toggleTaskComplete(task.id)
    );
    li.querySelector(".edit-btn").addEventListener("click", () =>
      editTask(task.id)
    );
    li.querySelector(".delete-btn").addEventListener("click", () =>
      deleteTask(task.id)
    );

    // Drag and drop
    li.addEventListener("dragstart", handleDragStart);

    return li;
  }

  // Format date time
  function formatDateTime(dateTimeString) {
    if (!dateTimeString) return "No due date";

    const date = new Date(dateTimeString);
    return date.toLocaleString();
  }

  // Toggle task completion
  function toggleTaskComplete(taskId) {
    tasks = tasks.map((task) => {
      if (task.id === taskId) {
        return { ...task, completed: !task.completed };
      }
      return task;
    });

    saveTasks();
    renderTasks();
    showNotification("Task status updated");
  }

  // Edit task
  function editTask(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    document.getElementById("taskTitle").value = task.title;
    document.getElementById("taskCategory").value = task.category;
    document.getElementById("taskDue").value = task.due;
    document.getElementById("taskDescription").value = task.description;
    document.getElementById("taskPriority").value = task.priority;

    // Select priority visually
    priorityOptions.forEach((opt) => {
      opt.classList.toggle("selected", opt.dataset.priority === task.priority);
    });

    // Remove the task being edited
    tasks = tasks.filter((t) => t.id !== taskId);
    saveTasks();
    renderTasks();

    // Scroll to form
    document.querySelector(".task-form").scrollIntoView({ behavior: "smooth" });

    showNotification("Task ready for editing");
  }

  // Delete task
  function deleteTask(taskId) {
    if (confirm("Are you sure you want to delete this task?")) {
      tasks = tasks.filter((task) => task.id !== taskId);
      saveTasks();
      renderTasks();
      showNotification("Task deleted successfully");
    }
  }

  // Save tasks to localStorage
  function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  // Update progress
  function updateProgress() {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    const remaining = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("completedTasks").textContent = completed;
    document.getElementById("remainingTasks").textContent = remaining;
    document.getElementById("progressFill").style.width = `${percentage}%`;
  }

  // Drag and drop functionality
  function handleDragStart(e) {
    e.dataTransfer.setData("text/plain", e.target.dataset.id);
  }

  // Initialize drag and drop for columns
  const columns = document.querySelectorAll(".task-list");

  columns.forEach((column) => {
    column.addEventListener("dragover", (e) => {
      e.preventDefault();
      column.classList.add("drag-over");
    });

    column.addEventListener("dragleave", () => {
      column.classList.remove("drag-over");
    });

    column.addEventListener("drop", (e) => {
      e.preventDefault();
      column.classList.remove("drag-over");

      const taskId = parseInt(e.dataTransfer.getData("text/plain"));
      const newPriority = column.dataset.priority;

      tasks = tasks.map((task) => {
        if (task.id === taskId) {
          return { ...task, priority: newPriority };
        }
        return task;
      });

      saveTasks();
      renderTasks();
      showNotification("Task priority updated");
    });
  });

  // Quotes functionality
  const quotes = [
    {
      text: "The future depends on what you do today.",
      author: "  Mahatma Gandhi",
    },
    {
      text: "Arise, awake, and stop not till the goal is reached.",
      author: "  Swami Vivekananda.",
    },
    {
      text: "A country's greatness lies in its undying ideals of love and sacrifice that inspire the mothers of the race.",
      author: "  Sarojini Naidu",
    },
    {
      text: "They may kill me, but they cannot kill my ideas. They can crush my body, but they will not be able to crush my spirit.",
      author: "  Bhagat Singh",
    },
    {
      text: "It is easy to kill individuals, but you cannot kill the ideas. Great empires crumbled, while the ideas survived.",
      author: "  Netaji Subhas Chandra Bose",
    },
    {
      text: "Swaraj is my birthright and I shall have it.",
      author: "  Bal Gangadhar Tilak",
    },
    {
      text: "In attaining our ideals, our means should be as pure as the end!",
      author: "  Dr. Rajendra Prasad",
    },
    {
      text: "Freedom is not given, it is taken.",
      author: "  Subhas Chandra Bose",
    },
  ];

  const quoteText = document.getElementById("quoteText");
  const quoteAuthor = document.getElementById("quoteAuthor");
  const newQuoteBtn = document.getElementById("newQuote");

  function showRandomQuote() {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];
    quoteText.textContent = `"${quote.text}"`;
    quoteAuthor.textContent = `- ${quote.author}`;
  }

  newQuoteBtn.addEventListener("click", showRandomQuote);

  // Notification system
  function showNotification(message, type = "success") {
    const notification = document.getElementById("notification");
    notification.textContent = message;

    // Set different colors based on type
    if (type === "error") {
      notification.style.backgroundColor = "var(--high-priority)";
    } else if (type === "info") {
      notification.style.backgroundColor = "var(--medium-priority)";
    } else {
      notification.style.backgroundColor = "var(--primary-color)";
    }

    notification.classList.add("show");

    setTimeout(() => {
      notification.classList.remove("show");
    }, 3000);
  }

  // Initialize the app
  renderTasks();
  showRandomQuote();
});
