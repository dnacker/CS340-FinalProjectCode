function deleteProblem(id) {
    $.ajax({
        url: '/problems/' + id,
        type: 'DELETE',
        success: function(result) {
            window.location.reload(true);
        }
    });
};