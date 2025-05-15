function showASSDupCheck(selectionList, onConfirm) {
    const dialog = document.createElement('div');
    dialog.id = "assDupCheckDialog";
    const selectedIds = new Set();
    const checkboxes = [];
    dialog.insertAdjacentHTML('afterbegin', `<h3>ASS 자막 중복 확인</h3><hr>`);
    // 전체 선택 버튼
    const selectAllBtn = document.createElement('button');
    selectAllBtn.textContent = '전체 선택';
    selectAllBtn.onclick = () => {
        checkboxes.forEach(cb => {
            cb.checked = true;
            selectedIds.add(cb.value);
        });
    };

    const deselectAllBtn = document.createElement('button');
    deselectAllBtn.textContent = '전체 해제';
    deselectAllBtn.onclick = () => {
        checkboxes.forEach(cb => {
            cb.checked = false;
            selectedIds.delete(cb.value);
        });
    };

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = '확인';
    confirmBtn.onclick = () => {
        document.body.removeChild(dialog);
        onConfirm([...selectedIds]);
    };

    dialog.appendChild(selectAllBtn);
    dialog.appendChild(deselectAllBtn);
    dialog.appendChild(confirmBtn);
    dialog.appendChild(document.createElement('hr'));

    for (const group of selectionList) {
        const groupTitle = document.createElement('div');
        groupTitle.innerHTML = `<strong>${group.key}</strong>`;
        dialog.appendChild(groupTitle);

        for (const opt of group.options) {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = opt.value;
            checkbox.onchange = () => {
                if (checkbox.checked) selectedIds.add(opt.value);
                else selectedIds.delete(opt.value);
            };
            label.appendChild(checkbox);
            label.append(` ${opt.label}`);
            dialog.appendChild(label);
            dialog.appendChild(document.createElement('br'));
            checkboxes.push(checkbox);
        }

        dialog.appendChild(document.createElement('hr'));
    }

    document.body.appendChild(dialog);
}
export default showASSDupCheck;