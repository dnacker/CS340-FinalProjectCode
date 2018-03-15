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