let tasks = {};

const createTask = function (taskText, taskDate, taskList) {
  // create elements that make up a task item
  const taskLi = $("<li>").addClass("list-group-item");
  const taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  const taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // check due date
  auditTask(taskLi)
  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

const loadTasks = function () {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function (list, arr) {
    // then loop over sub-array
    arr.forEach(function (task) {
      createTask(task.text, task.date, list);
    });
  });
};

const saveTasks = function () {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

$(".list-group").on("click", "p", function () {
  const text = $(this).text().trim();
  // This creates a new textarea element
  const textInput = $("<textarea>")
    .addClass("form-control")
    .val(text);
  $(this).replaceWith(textInput);
  textInput.trigger("focus");
})

// text was changed in list item
$(".list-group").on("blur", "textarea", function () {
  // get the textarea's current value/text
  const text = $(this)
    .val()
    .trim();
  // get the parent ul's id attribute
  const status = $(this)
    .closest(".list-group")
    // attr will return list-tasks-
    .attr("id")
    .replace("list-", "");
  console.log(status)
  // get the task's positino in the list of other li elements
  const index = $(this)
    .closest(".list-group-item")
    .index();
  console.log(index)

  tasks[status][index].text = text;
  saveTasks();
  // recreate p element
  const taskP = $("<p>")
    .addClass("m-1")
    .text(text);

  // replace textarea with p element
  $(this).replaceWith(taskP);
});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function () {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function () {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function () {
  // get form values
  const taskText = $("#modalTaskDescription").val();
  const taskDate = $("#modalDueDate").val();
  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");
    // close modal
    $("#task-form-modal").modal("hide");
    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });
    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function () {
  for (const key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});
//  due date was clicked
$(".list-group").on("click", "span", function () {
  // get current text
  const date = $(this)
    .text()
    .trim();
  //  create new input element 
  const dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);
  // swap out elements
  $(this).replaceWith(dateInput);
  // enable jquery ui datepicker
  dateInput.datepicker({
    minDate: 1,
    onClose: function() {
      // when calendar is closed, force a 'change' event on the 'dateInput'
      $(this).trigger("change")
    }
  })
  // automatically focus on new element
  dateInput.trigger("focus");
});


// value of due date was changed
$(".list-group").on("change", "input[type='text']", function () {
  // get current text
  const date = $(this)
    .val()
    .trim();
  // get the parent ul's id attribute
  const status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");
  // get the task's position in the list of other li elements
  const index = $(this)
    .closest(".list-group-item")
    .index();
  // update task in array and re-save to localstorage
  tasks[status][index].date = date;
  saveTasks();
  // recreate span element with bootstrap classes
  const taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);
  // replace input with span element
  $(this).replaceWith(taskSpan);
  // Pass task's <li> element into auditTask() to check new due date
  auditTask($(taskSpan).closest(".list-group-item"));
});

// make list items sortable
$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function (event) {
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function (event) {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag")
  },
  over: function (event) {
    $(this).addClass("dropover-active");
  },
  out: function (event) {
    $(event.target).removeClass("dropover-active");
  },
  update: function (event) {
    const tempArr = [];
    // loop over current set of children in sortable list
    $(this).children().each(function () {
      const text = $(this)
        .find("p")
        .text()
        .trim();
      const date = $(this)
        .find("span")
        .text()
        .trim();
      // add task data to the temp array as an object
      tempArr.push({
        text: text,
        date: date
      });
    });
    // trim down list's ID ot match object property
    const arrName = $(this)
      .attr("id")
      .replace("list-", "");
    // update array on tasks object and save 
    tasks[arrName] = tempArr;
    saveTasks();
  }
});
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch", 
  // the ui has a property that includes the draggable(the item being dragged). In lieu of 'this' because 'this' would refer to #trash
  drop: function(event, ui) {
    ui.draggable.remove();
    $(".bottom-trash").removeClass("bottom-trash-active");
  },
  over: function(event, ui) {
    $(".bottom-trash").addClass("bottom-trash-active");
  },
  out: function(event, ui) {
    $(".bottom-trash").removeClass("bottom-trash-active");
  }
})
// add datepicker to input element
$("#modalDueDate").datepicker({
  minDate: 1
});


// check to see how much time is left before task is due
const auditTask = function(taskEl) {
  // get date from task element
  const date = $(taskEl).find("span").text().trim();
  // ensure it worked

  // convert to moment object at 5:00pm
  let dateObj = new Date(date)
  // Set hour to 5pm
  dateObj.setHours(17);
  console.log(dateObj)
  // format date object 
  const formatDate = { 
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
  dateObj = dateObj.toLocaleString("en-US", formatDate);
  console.log(dateObj);
  // remove any old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger")
  // apply new class if task is near/over due date
  const today = new Date();
  const dueDate = new Date(date)
  if (dueDate < today) {
    $(taskEl).addClass("list-group-item-danger");
  } else if (dueDate < (today.setDate(today.getDate() + 5))) {
    $(taskEl).addClass("list-group-item-warning");
  }
}

// automate auditTask function to run every 30 minutes
setInterval(function () {
  $(".card .list-group-item").each(function(index, el){
    auditTask(el)
    console.log(el)
  })
}, (1000 * 60) * 30);
// load tasks for the first time
loadTasks();