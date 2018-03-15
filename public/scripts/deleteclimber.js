function deleteClimber(id) {
    var confirmDelete = confirm("Are you sure you want to delete this climber?");
    if (confirmDelete) {
        $.ajax({
            url: '/climbers/' + id,
            type: 'DELETE',
            success: function(result) {
                window.location.reload(true);
            }
        });
    }
};