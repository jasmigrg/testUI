// Row selection functionality - Select all, individual row selection, hover effects

function initRowSelection() {
    const table = document.getElementById('OverridesTable');
    if (!table) return;

    // Use event delegation on the table element
    table.addEventListener('change', (e) => {
        if (e.target.id === 'selectAllRows') {
            // Handle "Select All" checkbox
            const rowCheckboxes = table.querySelectorAll('.row-checkbox');
            rowCheckboxes.forEach(cb => {
                cb.checked = e.target.checked;
                const row = cb.closest('tr');
                if (row) {
                    row.classList.toggle('selected', e.target.checked);
                }
            });
        } else if (e.target.classList.contains('row-checkbox')) {
            // Handle individual row checkbox
            const row = e.target.closest('tr');
            if (row) {
                row.classList.toggle('selected', e.target.checked);
            }

            // Update "Select All" checkbox state
            const selectAllCheckbox = document.getElementById('selectAllRows');
            if (selectAllCheckbox) {
                const rowCheckboxes = table.querySelectorAll('.row-checkbox');
                selectAllCheckbox.checked = Array.from(rowCheckboxes).every(c => c.checked);
            }
        }
    });

    // Handle row click for selection
    table.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (!row || e.target.closest('input[type="checkbox"]')) return;

        const isCtrlPressed = e.ctrlKey || e.metaKey;

        if (isCtrlPressed) {
            row.classList.toggle('selected');
        } else {
            table.querySelectorAll('tr.selected').forEach(r => r.classList.remove('selected'));
            row.classList.add('selected');
        }
    });

    // Handle row hover
    table.addEventListener('mouseover', (e) => {
        const row = e.target.closest('tr');
        if (row && row.tagName === 'TR') {
            row.classList.add('hover');
        }
    });

    table.addEventListener('mouseout', (e) => {
        const row = e.target.closest('tr');
        if (row && row.tagName === 'TR') {
            row.classList.remove('hover');
        }
    });
}
