function updateClimber(id) {
    $.ajax({
        url: '/climbers/' + id,
        type: 'PUT',
        data: $('#update-climber').serialize(),
        success: function(result) {
            window.location.replace("./");
        }
    });
};