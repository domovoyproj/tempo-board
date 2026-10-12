import {
  $,
  escapeHTML as esc,
  dateKey,
  toast,
  load,
  save,
  download,
  readBackup,
  wireDialog,
} from "./shared.js";
import { initial, validState, selectTasks, progress } from "./model.js";
const KEY = "tempo.v1";
let state = load(KEY, initial, validState),
  view = "today",
  priority = "all";
const labels = { high: "Важное", normal: "Обычное", low: "Без спешки" };
const dialog = $("#task-dialog");
wireDialog(dialog);
function persist() {
  save(KEY, state);
  render();
}
function render() {
  const today = dateKey(),
    metrics = progress(state.tasks, today);
  $("#date-label").textContent = new Date().toLocaleDateString("ru", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  $("#year").textContent = new Date().getFullYear();
  $("#today-count").textContent = state.tasks.filter(
    (t) => !t.done && t.date <= today,
  ).length;
  $("#all-count").textContent = state.tasks.filter((t) => !t.done).length;
  $("#done-count").textContent = state.tasks.filter((t) => t.done).length;
  $("#stat-planned").textContent = metrics.total;
  $("#stat-done").textContent = metrics.done;
  $("#stat-percent").innerHTML = metrics.percent + "<span>%</span>";
  $("#progress-fill").style.width = metrics.percent + "%";
  $("#progress-caption").textContent =
    metrics.percent === 100
      ? "Всё готово. Можно выдохнуть."
      : metrics.total
        ? "Каждая галочка имеет значение"
        : "Начните с одной задачи";
  const tasks = selectTasks(
    state.tasks,
    view,
    today,
    priority,
    $("#search").value,
  );
  $("#list-title").innerHTML =
    {
      today: "План на сегодня",
      all: "Все активные задачи",
      done: "Завершённые задачи",
    }[view] +
    " <span>" +
    tasks.length +
    "</span>";
  $("#tasks").innerHTML = tasks.length
    ? tasks
        .map(
          (t) =>
            '<article class="task ' +
            (t.done ? "done" : "") +
            '"><button class="check" data-check="' +
            t.id +
            '" aria-label="' +
            esc((t.done ? "Вернуть: " : "Завершить: ") + t.title) +
            '" aria-pressed="' +
            t.done +
            '">' +
            (t.done ? "✓" : "") +
            '</button><div class="task-content"><button class="task-title" data-edit="' +
            t.id +
            '">' +
            esc(t.title) +
            "</button>" +
            (t.note ? '<p class="task-note">' + esc(t.note) + "</p>" : "") +
            '<div class="task-meta"><span class="tag ' +
            t.priority +
            '">' +
            labels[t.priority] +
            "</span><span>" +
            (t.date === today
              ? "Сегодня"
              : (t.date < today && !t.done ? "Просрочено · " : "") +
                new Date(t.date + "T12:00:00").toLocaleDateString("ru", {
                  day: "numeric",
                  month: "short",
                })) +
            '</span></div></div><button class="delete" data-delete="' +
            t.id +
            '" aria-label="' +
            esc("Удалить: " + t.title) +
            '">×</button></article>',
        )
        .join("")
    : '<div class="empty">' +
      (state.tasks.length
        ? "Здесь пока пусто.<br>Измените фильтр или добавьте новую задачу."
        : "Ваш день начинается с чистого листа.<br>Добавьте первую задачу — большую или совсем маленькую.") +
      "</div>";
  const selected = $("#focus-task").value;
  $("#focus-task").innerHTML =
    '<option value="">Свободная сессия</option>' +
    state.tasks
      .filter((t) => !t.done)
      .map((t) => '<option value="' + t.id + '">' + esc(t.title) + "</option>")
      .join("");
  $("#focus-task").value = state.tasks.some((t) => t.id === selected && !t.done)
    ? selected
    : "";
}
function edit(task) {
  $("#task-id").value = task?.id || "";
  $("#task-title").value = task?.title || "";
  $("#task-note").value = task?.note || "";
  $("#task-date").value = task?.date || dateKey();
  $("#task-priority").value = task?.priority || "normal";
  $("#dialog-title").textContent = task ? "Изменить задачу" : "Новая задача";
  dialog.showModal();
  $("#task-title").focus();
}
$("#new-task").onclick = () => edit();
$("#quick-add").onclick = () => edit();
$("#task-form").onsubmit = (event) => {
  event.preventDefault();
  const title = $("#task-title").value.trim();
  if (!title) {
    $("#task-title").focus();
    return;
  }
  const task = {
    id: $("#task-id").value || crypto.randomUUID(),
    title,
    date: $("#task-date").value,
    priority: $("#task-priority").value,
    note: $("#task-note").value.trim(),
    done: false,
  };
  const existing = state.tasks.find((t) => t.id === task.id);
  if (existing) Object.assign(existing, { ...task, done: existing.done });
  else {
    if (state.tasks.length >= 3000) {
      toast("Достигнут предел: 3000 задач. Экспортируйте и удалите старые.");
      return;
    }
    state.tasks.push(task);
  }
  persist();
  dialog.close();
  toast("Задача сохранена");
};
$("#tasks").onclick = (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.edit)
    edit(state.tasks.find((t) => t.id === button.dataset.edit));
  if (button.dataset.check) {
    const t = state.tasks.find((t) => t.id === button.dataset.check);
    t.done = !t.done;
    persist();
  }
  if (button.dataset.delete && confirm("Удалить эту задачу?")) {
    state.tasks = state.tasks.filter((t) => t.id !== button.dataset.delete);
    persist();
    toast("Задача удалена");
  }
};
document.querySelectorAll("[data-view]").forEach(
  (b) =>
    (b.onclick = () => {
      view = b.dataset.view;
      document
        .querySelectorAll("[data-view]")
        .forEach((x) => x.classList.toggle("active", x === b));
      render();
    }),
);
document.querySelectorAll("[data-priority]").forEach(
  (b) =>
    (b.onclick = () => {
      priority = b.dataset.priority;
      document
        .querySelectorAll("[data-priority]")
        .forEach((x) => x.classList.toggle("active", x === b));
      render();
    }),
);
$("#search").oninput = render;
$("#export").onclick = () =>
  download("tempo-" + dateKey() + ".json", {
    app: "tempo",
    version: 1,
    data: state,
  });
$("#import").onclick = () => $("#import-file").click();
$("#import-file").onchange = async (event) => {
  try {
    const next = await readBackup(event.target.files[0], "tempo", validState);
    if (confirm("Заменить текущие задачи резервной копией?")) {
      state = next;
      persist();
      toast("Задачи восстановлены");
    }
  } catch (error) {
    toast(error.message);
  }
  event.target.value = "";
};
let duration = 25 * 60,
  remaining = duration,
  deadline = null;
function updateTimer() {
  if (deadline) {
    remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    if (!remaining) {
      deadline = null;
      state.sessions++;
      save(KEY, state);
      toast("Фокус-сессия завершена. Время отдохнуть!");
      $("#timer-state").textContent = "ГОТОВО. ВЫДОХНИТЕ.";
    }
  }
  $("#timer").textContent =
    String(Math.floor(remaining / 60)).padStart(2, "0") +
    ":" +
    String(remaining % 60).padStart(2, "0");
  $("#timer-toggle").textContent = deadline
    ? "Пауза"
    : remaining === 0
      ? "Ещё одна сессия →"
      : remaining < duration
        ? "Продолжить →"
        : "Начать фокус →";
  $("#timer-progress").style.strokeDashoffset =
    559.2 * (1 - remaining / duration);
  document
    .querySelectorAll("[data-duration]")
    .forEach((b) => (b.disabled = !!deadline));
}
$("#timer-toggle").onclick = () => {
  if (deadline) {
    remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    deadline = null;
    $("#timer-state").textContent = "ПАУЗА";
  } else {
    if (!remaining) remaining = duration;
    deadline = Date.now() + remaining * 1000;
    $("#timer-state").textContent = "ВЫ В ПОТОКЕ";
  }
  updateTimer();
};
$("#timer-reset").onclick = () => {
  deadline = null;
  remaining = duration;
  $("#timer-state").textContent = "БЕЗ ОТВЛЕЧЕНИЙ";
  updateTimer();
};
document.querySelectorAll("[data-duration]").forEach(
  (b) =>
    (b.onclick = () => {
      duration = Number(b.dataset.duration) * 60;
      remaining = duration;
      deadline = null;
      document
        .querySelectorAll("[data-duration]")
        .forEach((x) => x.classList.toggle("active", x === b));
      $("#timer-state").textContent = "БЕЗ ОТВЛЕЧЕНИЙ";
      updateTimer();
    }),
);
setInterval(updateTimer, 250);
setInterval(render, 60000);
render();
updateTimer();
