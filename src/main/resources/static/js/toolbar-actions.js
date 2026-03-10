// Toolbar actions - Close, Clear QBE, Import, Export

function closeWindow() {
    window.close();
}

function clearQbe() {
    if (typeof QBEFilter !== 'undefined') {
        QBEFilter.clearQBEFilters();
    } else {
        // Fallback if QBEFilter not available
        document.querySelectorAll('input[name^="qbe."]').forEach(input => {
            input.value = '';
        });
    }
}

function importOverrides() {
    console.log('Import overrides');
    alert('Import functionality is not yet implemented.');
}

function exportOverrides() {
    const selectedIds = Array.from(document.querySelectorAll('.row-checkbox:checked'))
        .map(cb => cb.value);

    if (selectedIds.length === 0) {
        alert('Please select at least one row to export.');
        return;
    }

    console.log('Export overrides:', selectedIds);
    alert(`Exporting ${selectedIds.length} row(s)...`);
}
