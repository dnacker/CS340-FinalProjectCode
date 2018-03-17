function reset() {
    window.location.replace('/problems');
}

function filterStyles() {
    var styleFilter = document.getElementById('styleFilter');
    var val = styleFilter.value;
    window.location.replace('/problems/styles/' + val);
}

function deleteProblem(id) {
    var confirmDelete = confirm("Are you sure you want to delete this problem?");
    if (confirmDelete) {
        $.ajax({
            url: '/problems/' + id,
            type: 'DELETE',
            success: function(result) {
                window.location.reload(true);
            }
        });
    }
};