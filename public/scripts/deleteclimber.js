function deleteClimber(id) {
    $.ajax({
        url: '/climbers/' + id,
        type: 'DELETE',
        success: function(result) {
            window.location.reload(true);
        }
    });
};