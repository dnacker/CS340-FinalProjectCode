function updateProblem(id) {
    $.ajax({
        url: '/problems/' + id,
        type: 'PUT',
        data: $('#update-problem').serialize(),
        success: function(result) {
            window.location.replace("./");
        }
    });
};