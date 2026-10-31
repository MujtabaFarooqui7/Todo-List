document.addEventListener('DOMContentLoaded', () => {
  const todoForm = document.getElementById('todo-form');
  const todoInput = document.getElementById('todo-input');
  const todoList = document.getElementById('todo-list');
  const taskTemplate = document.getElementById('task-template');
  const filters = document.getElementById('filters');
  const summary = document.getElementById('summary');
  const progress = document.getElementById('progress');
  const progressBar = document.getElementById('progress-bar');
  const empty = document.getElementById('empty');
  const emptyTitle = document.getElementById('empty-title');
  const emptyText = document.getElementById('empty-text');

  const EMPTY_MESSAGES = {
    all: ['Nothing on your list', 'Add your first task above.'],
    active: ['Nothing left to do', 'Every task on your list is done.'],
    completed: ['No finished tasks yet', 'Tick a task when you finish it and it will show here.'],
  };

  let tasks = loadTasks();
  let currentFilter = 'all';

  document.getElementById('today').textContent = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  render();

  todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskText = todoInput.value.trim();
    todoInput.value = '';
    todoInput.focus();
    if (taskText === '') return;
    tasks.push({
      id: Date.now(),
      text: taskText,
      completed: false,
    });
    saveTasks();
    if (currentFilter === 'completed') setFilter('all');
    else render();
  });

  filters.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (button) setFilter(button.dataset.filter);
  });

  function loadTasks() {
    try {
      const stored = JSON.parse(localStorage.getItem('tasks'));
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch {
      summary.textContent = "Your browser couldn't save this change.";
    }
  }

  function setFilter(filter) {
    currentFilter = filter;
    filters.querySelectorAll('button').forEach((button) => {
      button.setAttribute('aria-pressed', button.dataset.filter === filter);
    });
    render();
  }

  function matchesFilter(task) {
    if (currentFilter === 'active') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    return true;
  }

  function render() {
    todoList.replaceChildren(...tasks.filter(matchesFilter).map(createTaskElement));
    updateStatus();
  }

  function updateStatus() {
    const total = tasks.length;
    const done = tasks.filter((task) => task.completed).length;
    const percent = total ? Math.round((done / total) * 100) : 0;

    if (total === 0) summary.textContent = 'No tasks yet';
    else if (done === total) summary.textContent = `All ${total} done`;
    else summary.textContent = `${done} of ${total} done`;

    progressBar.style.width = `${percent}%`;
    progress.setAttribute('aria-valuenow', percent);

    document.getElementById('count-all').textContent = total;
    document.getElementById('count-active').textContent = total - done;
    document.getElementById('count-completed').textContent = done;

    const isEmpty = todoList.children.length === 0;
    empty.hidden = !isEmpty;
    filters.hidden = total === 0;
    if (isEmpty) [emptyTitle.textContent, emptyText.textContent] = EMPTY_MESSAGES[currentFilter];
  }

  function createTaskElement(task) {
    const li = taskTemplate.content.firstElementChild.cloneNode(true);
    const checkbox = li.querySelector('input');
    const deleteBtn = li.querySelector('.task-delete');

    li.dataset.id = task.id;
    li.classList.toggle('completed', task.completed);
    li.querySelector('.task-text span').textContent = task.text;
    checkbox.checked = task.completed;
    deleteBtn.setAttribute('aria-label', `Delete ${task.text}`);

    checkbox.addEventListener('change', () => {
      task.completed = checkbox.checked;
      saveTasks();
      li.classList.toggle('completed', task.completed);
      if (currentFilter === 'all') updateStatus();
      else render();
    });

    deleteBtn.addEventListener('click', () => {
      const nextDelete = (li.nextElementSibling || li.previousElementSibling)?.querySelector('.task-delete');
      tasks = tasks.filter((t) => t.id !== task.id);
      saveTasks();
      li.remove();
      updateStatus();
      (nextDelete || todoInput).focus();
    });

    return li;
  }
});
