# Hierarchical Task Manager

Web-based task list application with support for unlimited nested subtasks, Markdown export, local persistence, undo/redo, and bilingual support (ES/EN).

## How to Use

You can view it at the following link [click here](#)

## Files

| File         | Description                               |
| ------------ | ----------------------------------------- |
| `index.html` | HTML structure of the application         |
| `style.css`  | Styles, light/dark themes, and animations |
| `app.js`     | All JavaScript logic                      |

## Features

* ✅ Tasks and subtasks nested with unlimited depth
* ✅ Completion checkbox with propagation to all child tasks
* ✅ Inline editing with double-click
* ✅ Add subtasks from any level
* ✅ Delete a task and all its child tasks automatically
* ✅ Drag & drop to reorder tasks and subtasks
* ✅ Undo / Redo with a 50-state history
* ✅ Language switch between Spanish / English
* ✅ Automatic saving in `localStorage`
* ✅ Markdown export (`.md`) with hierarchy and indentation
* ✅ Light / dark theme (detects system preference)
* ✅ Global progress bar
* ✅ Responsive design

## Keyboard Shortcuts

| Key            | Action                    |
| -------------- | ------------------------- |
| `N`            | New task                  |
| `T`            | Toggle light/dark theme   |
| `L`            | Change language (ES / EN) |
| `M`            | Download Markdown         |
| `Ctrl+Z`       | Undo                      |
| `Ctrl+Y`       | Redo                      |
| `H`            | Show shortcuts panel      |
| `Enter`        | Confirm editing           |
| `Esc`          | Cancel editing            |
| `Double click` | Edit a task’s text        |

## Markdown Export Format

```markdown
# My Tasks

*Exported on 5/23/2026*

- [x] Completed task
  - [x] Completed subtask
  - [ ] Pending subtask
- [ ] Pending task
```