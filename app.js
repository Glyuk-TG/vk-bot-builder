// Ждём полной загрузки страницы, чтобы размеры были правильные
window.addEventListener('load', function () {

  // Инициализация Drawflow
  const editor = new Drawflow(document.getElementById('drawflow'));
  editor.reroute = true;
  editor.start();

  // Счётчик для уникальных ID блоков
  let nodeCounter = 1;
  let selectedNodeId = null;

  // ============ ДОБАВЛЕНИЕ БЛОКОВ ============

  function addMessageNode() {
    const id = 'msg_' + (nodeCounter++);
    const html = `
      <div class="node-content">
        <div class="title-box">Сообщение</div>
        <textarea df-text placeholder="Текст..."></textarea>
      </div>
    `;
    editor.addNode(id, 1, 1, 100, 100, 'node-message', { type: 'message', text: '' }, html);
  }

  function addButtonsNode() {
    const id = 'btn_' + (nodeCounter++);
    const html = `
      <div class="node-content">
        <div class="title-box">Кнопки</div>
        <div class="node-buttons-preview">Нажми, чтобы настроить</div>
      </div>
    `;
    editor.addNode(id, 1, 1, 300, 100, 'node-buttons', {
      type: 'buttons',
      text: 'Выбери:',
      buttons: [{ label: 'Кнопка 1', next: '' }]
    }, html);
  }

  function addConditionNode() {
    const id = 'cond_' + (nodeCounter++);
    const html = `
      <div class="node-content">
        <div class="title-box">Условие</div>
        <div>Если совпадает с текстом</div>
      </div>
    `;
    editor.addNode(id, 1, 2, 500, 100, 'node-condition', {
      type: 'condition',
      match: ''
    }, html);
  }

  function addWaitNode() {
    const id = 'wait_' + (nodeCounter++);
    const html = `
      <div class="node-content">
        <div class="title-box">Ждать ввод</div>
        <div class="node-wait-preview">Сохранить в переменную</div>
      </div>
    `;
    editor.addNode(id, 1, 1, 700, 100, 'node-wait', {
      type: 'wait',
      text: 'Напиши ответ:',
      var_name: 'answer'
    }, html);
  }

  document.getElementById('btn-add-message').onclick = addMessageNode;
  document.getElementById('btn-add-buttons').onclick = addButtonsNode;
  document.getElementById('btn-add-condition').onclick = addConditionNode;
  document.getElementById('btn-add-wait').onclick = addWaitNode;

  // ============ РЕДАКТИРОВАНИЕ БЛОКА ============

  editor.on('nodeSelected', function (id) {
    selectedNodeId = id;
    const node = editor.getNodeFromId(id);
    const data = node.data;

    document.getElementById('no-selection').hidden = true;
    document.getElementById('editor-form').hidden = false;
    document.getElementById('node-id').value = id;

    document.querySelectorAll('.field').forEach(f => f.hidden = true);

    if (data.type === 'message') {
      document.getElementById('field-text').hidden = false;
      document.getElementById('node-text').value = data.text || '';
    } else if (data.type === 'buttons') {
      document.getElementById('field-text').hidden = false;
      document.getElementById('field-buttons').hidden = false;
      document.getElementById('node-text').value = data.text || '';
      renderButtonsList(data.buttons || []);
    } else if (data.type === 'condition') {
      document.getElementById('field-text').hidden = false;
      document.getElementById('node-text').value = data.match || '';
    } else if (data.type === 'wait') {
      document.getElementById('field-text').hidden = false;
      document.getElementById('field-var').hidden = false;
      document.getElementById('node-text').value = data.text || '';
      document.getElementById('node-var-name').value = data.var_name || '';
    }
  });

  editor.on('nodeUnselected', function () {
    selectedNodeId = null;
    document.getElementById('no-selection').hidden = false;
    document.getElementById('editor-form').hidden = true;
  });

  document.getElementById('node-text').addEventListener('input', function (e) {
    if (!selectedNodeId) return;
    const node = editor.getNodeFromId(selectedNodeId);
    const data = node.data;

    if (data.type === 'condition') {
      data.match = e.target.value;
    } else {
      data.text = e.target.value;
    }
    editor.updateNodeDataFromId(selectedNodeId, data);
  });

  document.getElementById('node-var-name').addEventListener('input', function (e) {
    if (!selectedNodeId) return;
    const node = editor.getNodeFromId(selectedNodeId);
    node.data.var_name = e.target.value;
    editor.updateNodeDataFromId(selectedNodeId, node.data);
  });

  // ============ РАБОТА С КНОПКАМИ ============

  function renderButtonsList(buttons) {
    const container = document.getElementById('buttons-list');
    container.innerHTML = '';
    buttons.forEach((btn, i) => {
      const row = document.createElement('div');
      row.className = 'button-row';
      row.innerHTML = `
        <input type="text" value="${btn.label || ''}" placeholder="Текст кнопки" data-index="${i}">
        <button type="button" data-remove="${i}">×</button>
      `;
      container.appendChild(row);
    });

    container.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', function (e) {
        if (!selectedNodeId) return;
        const idx = parseInt(e.target.dataset.index);
        const node = editor.getNodeFromId(selectedNodeId);
        node.data.buttons[idx].label = e.target.value;
        editor.updateNodeDataFromId(selectedNodeId, node.data);
      });
    });

    container.querySelectorAll('button[data-remove]').forEach(btn => {
      btn.addEventListener('click', function (e) {
        if (!selectedNodeId) return;
        const idx = parseInt(e.target.dataset.remove);
        const node = editor.getNodeFromId(selectedNodeId);
        node.data.buttons.splice(idx, 1);
        editor.updateNodeDataFromId(selectedNodeId, node.data);
        renderButtonsList(node.data.buttons);
      });
    });
  }

  document.getElementById('btn-add-button-row').onclick = function () {
    if (!selectedNodeId) return;
    const node = editor.getNodeFromId(selectedNodeId);
    if (node.data.type !== 'buttons') return;
    node.data.buttons.push({ label: 'Новая кнопка', next: '' });
    editor.updateNodeDataFromId(selectedNodeId, node.data);
    renderButtonsList(node.data.buttons);
  };

  // ============ УДАЛЕНИЕ БЛОКА ============

  document.getElementById('btn-delete-node').onclick = function () {
    if (!selectedNodeId) return;
    if (!confirm('Удалить блок?')) return;
    editor.removeNodeId(selectedNodeId);
    selectedNodeId = null;
    document.getElementById('no-selection').hidden = false;
    document.getElementById('editor-form').hidden = true;
  };

  // ============ ЭКСПОРТ ============

  document.getElementById('btn-export').onclick = function () {
    const data = editor.export();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scenario.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============ ИМПОРТ ============

  document.getElementById('btn-import').onclick = function () {
    document.getElementById('file-input').click();
  };

  document.getElementById('file-input').onchange = function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      try {
        const data = JSON.parse(ev.target.result);
        editor.import(data);
        let maxN = 0;
        Object.keys(data.drawflow.Home.data).forEach(id => {
          const m = id.match(/_(\d+)$/);
          if (m) maxN = Math.max(maxN, parseInt(m[1]));
        });
        nodeCounter = maxN + 1;
      } catch (err) {
        alert('Ошибка чтения файла: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ============ СТАРТОВЫЙ БЛОК ============

  addMessageNode();

});
